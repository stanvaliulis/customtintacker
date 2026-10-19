import {randomUUID} from 'node:crypto';
import {StorageError,type Revision,type Receipt} from '../artwork-storage/service';
import {transactionalStorage,type StorageTransaction} from '../artwork-storage/repository';
import {invoiceRepository,type InvoiceTransaction,type InvoiceRequest} from '../commerce/invoice';
export interface SqlTransaction {$queryRawUnsafe<T=unknown>(sql:string,...values:unknown[]):Promise<T>; $executeRawUnsafe(sql:string,...values:unknown[]):Promise<number>}
export interface PrismaTransactions {$transaction<T>(work:(tx:SqlTransaction)=>Promise<T>,options:{isolationLevel:'Serializable';maxWait:number;timeout:number}):Promise<T>}
/** Fixed SQL only: every dynamic value is a bound parameter. No connection or env access here. */
export function postgresAdapters(client:PrismaTransactions){
 async function transaction<T>(work:(tx:SqlTransaction)=>Promise<T>):Promise<T>{
  for(let attempt=0;;attempt++){try{return await client.$transaction(work,{isolationLevel:'Serializable',maxWait:5000,timeout:15000});}catch(e){const err=e as {code?:string;meta?:{code?:string}},code=err.code==='P2010'?err.meta?.code:err.code;if(attempt>=2||!['P2034','40001','40P01','P2002','23505'].includes(code||''))throw e;}}
 }
 const one=async<T>(tx:SqlTransaction,sql:string,...values:unknown[])=>{const rows=await tx.$queryRawUnsafe<Array<{payload:T}>>(sql,...values);return rows[0]?.payload||null;};
 const storageTx=(tx:SqlTransaction):StorageTransaction=>({
  receipt:(o,k)=>one<Receipt>(tx,'SELECT payload FROM tin_workflow.receipt WHERE owner_id=$1 AND request_key=$2',o,k),
  source:(o,id)=>one(tx,"SELECT payload FROM tin_workflow.revision WHERE owner_id=$1 AND id=$2 AND kind='source'",o,id),
  head:(o,id,kind)=>one<Revision>(tx,'SELECT r.payload FROM tin_workflow.head h JOIN tin_workflow.revision r ON r.owner_id=h.owner_id AND r.id=h.revision_id WHERE h.owner_id=$1 AND h.design_id=$2 AND h.kind=$3',o,id,kind),
  insertRevision:async r=>{await tx.$executeRawUnsafe('INSERT INTO tin_workflow.revision(owner_id,id,design_id,kind,version,source_id,payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)',r.ownerId,r.id,r.designId,r.kind,r.version,r.kind==='proof'?r.sourceId:null,JSON.stringify(r));},
  compareAndSwapHead:async(o,id,kind,expected,next)=>expected===null?(await tx.$executeRawUnsafe('INSERT INTO tin_workflow.head(owner_id,design_id,kind,revision_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',o,id,kind,next))===1:(await tx.$executeRawUnsafe('UPDATE tin_workflow.head SET revision_id=$4 WHERE owner_id=$1 AND design_id=$2 AND kind=$3 AND revision_id=$5',o,id,kind,next,expected))===1,
  insertReceipt:async(o,k,r)=>{await tx.$executeRawUnsafe('INSERT INTO tin_workflow.receipt(owner_id,request_key,revision_id,payload) VALUES($1,$2,$3,$4::jsonb)',o,k,r.revision.id,JSON.stringify(r));},
 });
 const invoiceTx=(tx:SqlTransaction):InvoiceTransaction=>({
  byRequest:(o,k)=>one<InvoiceRequest>(tx,'SELECT payload FROM tin_workflow.invoice_request WHERE owner_id=$1 AND request_key=$2',o,k),
  insert:async(k,o)=>{
   if(o.business!=='IG'||o.paid!==false||o.status!=='invoice-requested'||o.productionReleased!==false)throw new StorageError('Invalid invoice state.');
   for(const binding of o.sources){const source=await storageTx(tx).source(o.ownerId,binding.revisionId),head=await storageTx(tx).head(o.ownerId,binding.designId,'source');if(!source||source.designId!==binding.designId||source.sourceHash!==binding.sourceHash||head?.id!==source.id)throw new StorageError('Invoice source changed.',409);}
   if(o.sources.length!==o.items.length||o.sources.some((s,i)=>s.designId!==o.items[i].design.id||s.sourceHash!==o.items[i].design.attachment.sourceHash))throw new StorageError('Invoice source mismatch.',409);
   await tx.$executeRawUnsafe('INSERT INTO tin_workflow.invoice_request(owner_id,id,request_key,payload) VALUES($1,$2,$3,$4::jsonb)',o.ownerId,o.id,k,JSON.stringify(o));
  },
  enqueueOnce:async(k,o)=>{await tx.$executeRawUnsafe('INSERT INTO tin_workflow.outbox(job_key,owner_id,order_id) VALUES($1,$2,$3) ON CONFLICT(job_key) DO NOTHING',k,o.ownerId,o.id);},
 });
 const storage=transactionalStorage({transaction:work=>transaction(tx=>work(storageTx(tx)))});
 const invoices=invoiceRepository({transaction:work=>transaction(tx=>work(invoiceTx(tx)))});
 // Worker operations use database time and token fencing; a stale worker cannot acknowledge another lease.
 const fenced=async(sql:string,values:unknown[])=>transaction(async tx=>{if(await tx.$executeRawUnsafe(sql,...values)!==1)throw new StorageError('Notification lease lost.',409);});
 const guard=" WHERE job_key=$1 AND lease_token=$2 AND lease_until>floor(extract(epoch from clock_timestamp())*1000) AND state='sending'";
 const outbox={
  claim:async(_now:number,leaseMs:number)=>transaction(async tx=>{if(leaseMs<1000||leaseMs>60000)throw new StorageError('Invalid lease.');const token=randomUUID();const rows=await tx.$queryRawUnsafe<Array<{job_key:string;attempts:number;payload:InvoiceRequest}>>("WITH due AS (SELECT job_key FROM tin_workflow.outbox WHERE state IN ('pending','sending') AND due_at<=floor(extract(epoch from clock_timestamp())*1000) AND (lease_until IS NULL OR lease_until<=floor(extract(epoch from clock_timestamp())*1000)) ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT 1), claimed AS (UPDATE tin_workflow.outbox o SET state='sending',lease_token=$1,lease_until=floor(extract(epoch from clock_timestamp())*1000)+$2,attempts=o.attempts+1 FROM due WHERE o.job_key=due.job_key RETURNING o.*) SELECT c.job_key,c.attempts,i.payload FROM claimed c JOIN tin_workflow.invoice_request i ON i.owner_id=c.owner_id AND i.id=c.order_id",token,leaseMs);return rows[0]?{key:rows[0].job_key,leaseToken:token,attempts:rows[0].attempts,order:rows[0].payload}:null;}),
  bindFirstAttempt:async(job:{key:string;leaseToken:string},_now:number)=>transaction(async tx=>{const rows=await tx.$queryRawUnsafe<Array<{first_attempt:number|string}>>("UPDATE tin_workflow.outbox SET first_attempt=COALESCE(first_attempt,floor(extract(epoch from clock_timestamp())*1000))"+guard+' RETURNING first_attempt',job.key,job.leaseToken);if(!rows[0])throw new StorageError('Notification lease lost.',409);return Number(rows[0].first_attempt);}),
  complete:(job:{key:string;leaseToken:string},messageId:string)=>fenced("UPDATE tin_workflow.outbox SET state='delivered',message_id=$3,lease_until=NULL"+guard,[job.key,job.leaseToken,messageId]),
  retry:(job:{key:string;leaseToken:string},nextAt:number)=>fenced("UPDATE tin_workflow.outbox SET state='pending',due_at=$3,lease_until=NULL"+guard,[job.key,job.leaseToken,nextAt]),
  hold:(job:{key:string;leaseToken:string})=>fenced("UPDATE tin_workflow.outbox SET state='held',lease_until=NULL"+guard,[job.key,job.leaseToken]),
 };
 return {storage,invoices,outbox};
}
