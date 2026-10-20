import {canonical} from '../design/proof-attachment';
import type {PrismaTransactions,SqlTransaction} from '../persistence/postgres';
import type {InvoiceRequest} from './invoice';
import type {SourceRevision,ProofRevision} from '../artwork-storage/service';
import {prepareFinalPaymentReview} from './final-payment-review';
import {CommerceError,hash} from './service';
export type FinalReview=ReturnType<typeof prepareFinalPaymentReview>;
export interface ReviewInput {shipping:number;tax:number;version:string;proofIds:string[];confirmFinalAmount:true}
export function paymentReviews(client:PrismaTransactions){
 async function tx<T>(work:(tx:SqlTransaction)=>Promise<T>):Promise<T>{for(let attempt=0;;attempt++)try{return await client.$transaction(work,{isolationLevel:'Serializable',maxWait:5000,timeout:15000});}catch(error){const e=error as {code?:string;meta?:{code?:string}},code=e.code==='P2010'?e.meta?.code:e.code;if(attempt>=3||!['P2034','40001','40P01','P2002','23505'].includes(code||''))throw error;}}
 const get=async(invoiceId:string,ownerId?:string)=>tx(async db=>{const rows=await db.$queryRawUnsafe<Array<{owner_id:string;payload:FinalReview}>>('SELECT owner_id,payload FROM tin_payments.final_review WHERE invoice_id=$1 AND ($2::text IS NULL OR owner_id=$2)',invoiceId,ownerId||null);const row=rows[0];if(row&&(row.payload.invoiceRequestId!==invoiceId||row.payload.priced.ownerId!==row.owner_id))throw new CommerceError('Final review ownership mismatch.',503);return row?.payload||null;});
 const approve=async(invoiceId:string,input:ReviewInput)=>{
  if(input.confirmFinalAmount!==true||!/^[A-Za-z0-9_-]{1,80}$/.test(input.version)||!Array.isArray(input.proofIds)||input.proofIds.length>50||input.proofIds.some(x=>typeof x!=='string'||!/^proof-[a-f0-9]{64}$/.test(x)))throw new CommerceError('Explicit final-amount and proof confirmation required.',400);
  const raw={shipping:input.shipping,tax:input.tax,version:input.version,proofIds:[...input.proofIds]},requestHash=hash(canonical(raw));
  return tx(async db=>{
   const old=await db.$queryRawUnsafe<Array<{request_hash:string;payload:FinalReview}>>('SELECT request_hash,payload FROM tin_payments.final_review WHERE invoice_id=$1',invoiceId);
   if(old[0]){if(old[0].request_hash!==requestHash)throw new CommerceError('A final review already exists; staff reconciliation required before amendment.',409);return old[0].payload;}
   const invoices=await db.$queryRawUnsafe<Array<{payload:InvoiceRequest}>>('SELECT payload FROM tin_workflow.invoice_request WHERE id=$1 FOR SHARE',invoiceId);
   const invoice=invoices[0]?.payload;if(!invoice||invoice.id!==invoiceId)throw new CommerceError('Invoice request unavailable.',404);
   const proofs=[];
   for(let i=0;i<invoice.sources.length;i++){
    const binding=invoice.sources[i];
    const sources=await db.$queryRawUnsafe<Array<{payload:SourceRevision}>>("SELECT r.payload FROM tin_workflow.revision r JOIN tin_workflow.head h ON h.owner_id=r.owner_id AND h.revision_id=r.id AND h.kind='source' WHERE r.owner_id=$1 AND r.id=$2 FOR SHARE OF r,h",invoice.ownerId,binding.revisionId);
    const source=sources[0]?.payload;
    const versions=await db.$queryRawUnsafe<Array<{payload:ProofRevision}>>("SELECT r.payload FROM tin_workflow.revision r JOIN tin_workflow.head h ON h.owner_id=r.owner_id AND h.revision_id=r.id AND h.kind='proof' WHERE r.owner_id=$1 AND r.id=$2 FOR SHARE OF r,h",invoice.ownerId,input.proofIds[i]||'');
    const proof=versions[0]?.payload;
    if(!source||!proof||source.ownerId!==invoice.ownerId||proof.ownerId!==invoice.ownerId||source.sourceHash!==binding.sourceHash||source.designId!==binding.designId||source.product.id!==invoice.items[i]?.productId||source.document.sha256!==invoice.items[i]?.design.canvasHash||proof.sourceId!==source.id||proof.sourceHash!==source.sourceHash||proof.designId!==source.designId||proof.productId!==source.product.id)throw new CommerceError('Current prepared proofs must match the invoice artwork.',409);
    proofs.push({designId:source.designId,sourceHash:source.sourceHash,canvasHash:invoice.items[i].design.canvasHash,
     print:{id:proof.id+':print',version:String(proof.version),sha256:proof.print.sha256},
     ...(proof.emboss?{emboss:{id:proof.id+':emboss',version:String(proof.version),sha256:proof.emboss.sha256}}:{})});
   }
   const review=prepareFinalPaymentReview(invoice,{...raw,staffId:'authenticated-admin',approvedAt:new Date().toISOString(),proofs});
   await db.$executeRawUnsafe('INSERT INTO tin_payments.final_review(invoice_id,owner_id,request_hash,review_hash,payload) VALUES($1,$2,$3,$4,$5::jsonb)',invoice.id,invoice.ownerId,requestHash,review.reviewHash,JSON.stringify(review));return review;
  });
 };
 return {get,approve};
}
