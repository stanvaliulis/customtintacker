import { randomUUID } from 'node:crypto';
import { canonical } from '../design/proof-attachment';
import type { PrismaTransactions, SqlTransaction } from '../persistence/postgres';
import { CommerceError, type Order } from './service';
import { transactionalRepository, type CommerceTransaction } from './repository';

type StoredOrder = Order & {paymentId?: string};
type Row = {snapshot:StoredOrder;session_id:string|null;checkout_url:string|null;payment_id:string|null;paid:boolean};
/** No environment access, provider calls or route activation. Caller must supply the approved database. */
export function paymentPostgres(client:PrismaTransactions) {
 async function transaction<T>(work:(tx:SqlTransaction)=>Promise<T>):Promise<T> {
  for(let attempt=0;;attempt++)try{return await client.$transaction(work,{isolationLevel:'Serializable',maxWait:5000,timeout:15000});}
  catch(error){const e=error as {code?:string;meta?:{code?:string}},code=e.code==='P2010'?e.meta?.code:e.code;
   if(attempt>=3||!['P2034','40001','40P01','P2002','23505'].includes(code||''))throw error;}
 }
 async function one(tx:SqlTransaction,sql:string,...values:unknown[]):Promise<StoredOrder|null>{
  const [r]=await tx.$queryRawUnsafe<Row[]>(sql,...values);return r?{...r.snapshot,paid:r.paid,
   ...(r.session_id?{sessionId:r.session_id,checkoutUrl:r.checkout_url!}:{}),...(r.payment_id?{paymentId:r.payment_id}:{})}:null;
 }
 function immutable(o:StoredOrder){const {sessionId,checkoutUrl,paymentId,paid,...snapshot}=o;void sessionId;void checkoutUrl;void paymentId;void paid;return snapshot;}
 const adapter=(tx:SqlTransaction):CommerceTransaction=>({
  byRequest:(owner,key)=>one(tx,'SELECT * FROM tin_payments.payment_order WHERE owner_id=$1 AND request_key=$2',owner,key),
  byId:id=>one(tx,'SELECT * FROM tin_payments.payment_order WHERE id=$1',id),
  bySession:id=>one(tx,'SELECT * FROM tin_payments.payment_order WHERE session_id=$1',id),
  byPayment:id=>one(tx,'SELECT * FROM tin_payments.payment_order WHERE payment_id=$1',id),
  insert:async(key,o)=>{
   if(o.business!=='IG'||o.currency!=='usd'||o.paid||!o.ownerId||o.sessionId||o.checkoutUrl||
     [o.subtotal,o.setup,o.rush,o.shipping,o.tax,o.total].some(n=>!Number.isSafeInteger(n)||n<0)||
     o.total!==o.subtotal+o.setup+o.rush+o.shipping+o.tax)throw new CommerceError('Invalid immutable payment order.',409);
   await tx.$executeRawUnsafe('INSERT INTO tin_payments.payment_order(id,owner_id,request_key,request_hash,snapshot) VALUES($1,$2,$3,$4,$5::jsonb)',o.id,o.ownerId,key,o.requestHash,JSON.stringify(o));
  },
  update:async o=>{
   const old=await adapter(tx).byId(o.id) as StoredOrder|null;
   if(!old||canonical(immutable(old))!==canonical(immutable(o)))throw new CommerceError('Immutable order changed.',409);
   if(o.sessionId&&(!/^cs_[A-Za-z0-9_]+$/.test(o.sessionId)||!o.checkoutUrl||!/^https:\/\/checkout\.stripe\.com\//.test(o.checkoutUrl)))throw new CommerceError('Invalid hosted payment destination.',409);
   await tx.$executeRawUnsafe('UPDATE tin_payments.payment_order SET session_id=$2,checkout_url=$3,payment_id=$4,paid=$5,updated_at=now() WHERE id=$1',o.id,o.sessionId||null,o.checkoutUrl||null,o.paymentId||null,o.paid);
  },
  event:async id=>{const rows=await tx.$queryRawUnsafe<Array<{payload_hash:string}>>('SELECT payload_hash FROM tin_payments.payment_event WHERE id=$1',id);return rows[0]?.payload_hash||null;},
  insertEvent:async(id,h,orderId)=>{await tx.$executeRawUnsafe('INSERT INTO tin_payments.payment_event(id,payload_hash,order_id) VALUES($1,$2,$3)',id,h,orderId);},
  authorizeReviewedPayment:async o=>{const rows=await tx.$queryRawUnsafe<Array<{review_hash:string}>>("SELECT a.review_hash FROM tin_payments.customer_acknowledgment a JOIN tin_payments.final_review r ON r.invoice_id=a.invoice_id AND r.owner_id=a.owner_id AND r.review_hash=a.review_hash JOIN tin_payments.payment_order p ON p.owner_id=a.owner_id AND p.request_key='invoice-'||a.invoice_id AND p.request_hash=a.review_hash WHERE p.id=$1 FOR SHARE OF a,r",o.id);if(rows.length!==1||rows[0].review_hash!==o.requestHash)throw new CommerceError('Current customer acknowledgment required.',409);},
  enqueueOnce:async(key,o)=>{if(!o.paid)throw new CommerceError('Unpaid order cannot be released.',409);await tx.$executeRawUnsafe("INSERT INTO tin_payments.outbox(job_key,order_id,state) VALUES($1,$2,'held') ON CONFLICT(job_key) DO NOTHING",key,o.id);await tx.$executeRawUnsafe("INSERT INTO tin_payments.notification_outbox(job_key,order_id) VALUES($1,$2) ON CONFLICT(job_key) DO NOTHING",'paid-staff-'+o.id,o.id);},
 });
 const repository=transactionalRepository({transaction:work=>transaction(tx=>work(adapter(tx)))});
 const outbox={
  // Unknown provider outcomes are held permanently for staff reconciliation, never automatically resent.
  claim:()=>transaction(async tx=>{
   await tx.$executeRawUnsafe("UPDATE tin_payments.outbox SET state='held' WHERE state='claimed' AND lease_until<=clock_timestamp()");
   const token=randomUUID();const rows=await tx.$queryRawUnsafe<Array<{job_key:string;order_id:string}>>("WITH candidate AS (SELECT job_key FROM tin_payments.outbox WHERE state='pending' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE tin_payments.outbox o SET state='claimed',lease_token=$1,lease_until=clock_timestamp()+interval '60 seconds' FROM candidate c WHERE o.job_key=c.job_key RETURNING o.job_key,o.order_id",token);
   if(!rows[0])return null;const order=await adapter(tx).byId(rows[0].order_id);if(!order?.paid)throw new CommerceError('Invalid paid outbox.',409);
   return {key:rows[0].job_key,leaseToken:token,order};
  }),
  complete:(key:string,token:string,receipt:string)=>transaction(async tx=>{
   if(!receipt||receipt.length>200||/[\r\n]/.test(receipt))throw new CommerceError('Provider receipt required.',409);
   const n=await tx.$executeRawUnsafe("UPDATE tin_payments.outbox SET state='completed',provider_receipt=$3,completed_at=now() WHERE job_key=$1 AND lease_token=$2 AND state='claimed' AND lease_until>clock_timestamp()",key,token,receipt);
   if(n!==1)throw new CommerceError('Payment outbox lease lost.',409);
  }),
  hold:(key:string,token:string)=>transaction(async tx=>{const n=await tx.$executeRawUnsafe("UPDATE tin_payments.outbox SET state='held' WHERE job_key=$1 AND lease_token=$2 AND state='claimed'",key,token);if(n!==1)throw new CommerceError('Payment outbox lease lost.',409);}),
 };
 const startSessionAttempt=(id:string)=>transaction(async tx=>{
  const rows=await tx.$queryRawUnsafe<Array<{started:Date}>>("UPDATE tin_payments.payment_order SET session_first_attempt=COALESCE(session_first_attempt,clock_timestamp()) WHERE id=$1 AND NOT paid RETURNING session_first_attempt AS started",id);
  if(!rows[0])throw new CommerceError('Payment order unavailable.',409);return rows[0].started.getTime();
 });
 const orderById=(owner:string,id:string)=>transaction(async tx=>{const o=await adapter(tx).byId(id);return o?.ownerId===owner?o:null;});
 return {repository,outbox,startSessionAttempt,orderById};
}
