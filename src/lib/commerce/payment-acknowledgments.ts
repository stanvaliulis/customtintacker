import type {PrismaTransactions,SqlTransaction} from '../persistence/postgres';
import {CommerceError} from './service';

/** The review hash binds amounts and exact proof IDs, versions and content hashes. */
export function paymentAcknowledgments(db:PrismaTransactions & SqlTransaction){
 const current=async(invoiceId:string,ownerId:string,reviewHash:string)=>{
  const rows=await db.$queryRawUnsafe<Array<{review_hash:string}>>('SELECT a.review_hash FROM tin_payments.customer_acknowledgment a JOIN tin_payments.final_review r ON r.invoice_id=a.invoice_id AND r.owner_id=a.owner_id AND r.review_hash=a.review_hash WHERE a.invoice_id=$1 AND a.owner_id=$2 AND a.review_hash=$3',invoiceId,ownerId,reviewHash);
  return rows.length===1;
 };
 return {current,
  async acknowledge(invoiceId:string,ownerId:string,reviewHash:string){
   if(!/^[a-f0-9]{64}$/.test(reviewHash))throw new CommerceError('Valid approved review required.',400);
   for(let attempt=0;;attempt++)try{return await db.$transaction(async tx=>{
    const rows=await tx.$queryRawUnsafe<Array<{review_hash:string}>>('SELECT review_hash FROM tin_payments.final_review WHERE invoice_id=$1 AND owner_id=$2 FOR SHARE',invoiceId,ownerId);
    if(!rows[0])throw new CommerceError('Approved review unavailable.',404);
    if(rows[0].review_hash!==reviewHash)throw new CommerceError('Proofs or final amount changed. Review again.',409);
    await tx.$executeRawUnsafe('INSERT INTO tin_payments.customer_acknowledgment(invoice_id,owner_id,review_hash) VALUES($1,$2,$3) ON CONFLICT(invoice_id,owner_id,review_hash) DO NOTHING',invoiceId,ownerId,reviewHash);
    return {acknowledged:true,reviewHash};
   },{isolationLevel:'Serializable',maxWait:5000,timeout:15000});}catch(error){const e=error as {code?:string;meta?:{code?:string}},code=e.code==='P2010'?e.meta?.code:e.code;if(attempt>=3||!['P2034','40001','40P01','P2002','23505'].includes(code||''))throw error;}
  },
  async require(invoiceId:string,ownerId:string,reviewHash:string){if(!await current(invoiceId,ownerId,reviewHash))throw new CommerceError('Acknowledge the current proofs and final amount before checkout.',409);}
 };
}
