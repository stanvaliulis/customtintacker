import {checkoutPaused,requireCheckoutOpen} from '../commerce/checkout-pause';
import 'server-only';
import {livePaymentConfig} from '../commerce/live-payment-config';
import {manualHandoff} from '../commerce/manual-handoff';
import {reusableCheckout} from '../commerce/checkout-reuse';
import {paymentAcknowledgments} from '../commerce/payment-acknowledgments';
import Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {prisma} from '../db';
import {staffInvoice} from './staff-invoice';
import {productionContext} from './server';
import {postgresAdapters} from './postgres';
import {vercelPrivateBlobs} from './vercel-private';
import {publishProof,type ProofRevision} from '../artwork-storage/service';
import {paymentPostgres} from '../commerce/payment-postgres';
import {paymentReviews,type ReviewInput} from '../commerce/payment-reviews';
import {reviewedStripe} from '../commerce/stripe-reviewed';
import {stripeEventVerifier} from '../commerce/stripe-events';
import {CommerceError} from '../commerce/service';
import type {PaymentActions} from '../commerce/payment-http';

export async function paymentTestGate(){
 if(Date.now()>=Date.parse('2026-10-27T13:00:00Z'))throw new CommerceError('Test payment window expired.',503);
 if(process.env.TIN_PAYMENTS_TEST_ENABLED!=='1'||process.env.VERCEL_ENV!=='preview')throw new CommerceError('Reviewed payments are not active.',503);
 let host:string;try{host=new URL(process.env.POSTGRES_PRISMA_URL||'').hostname;}catch{throw new CommerceError('Isolated preview database required.',503);}
 if(!process.env.TIN_PAYMENTS_TEST_DATABASE_HOST||host!==process.env.TIN_PAYMENTS_TEST_DATABASE_HOST||host.includes('ep-jolly-shape-a4ni83gl'))throw new CommerceError('Verified nonproduction payment database required.',503);
 const rows=await prisma.$queryRawUnsafe<Array<{version:number}>>('SELECT version FROM tin_payments.schema_version');
 if(rows.length!==1||rows[0].version!==1)throw new CommerceError('Payment schema is not ready.',503);
 const identity=await prisma.$queryRawUnsafe<Array<{id:string}>>('SELECT id FROM tin_preview.identity');
 if(identity.length!==1||identity[0].id!=='customtintacker-preview-test-20261020')throw new CommerceError('Synthetic payment database required.',503);
}
async function paymentExecutionGate(){
 if(process.env.VERCEL_ENV!=='production')return paymentTestGate();
 livePaymentConfig(process.env);
 const rows=await prisma.$queryRawUnsafe<Array<{contract:string}>>("SELECT contract FROM tin_payments.launch_identity WHERE id='customtintackers-production'");
 if(rows.length!==1||rows[0].contract!=='staff-reviewed-manual-v1')throw new CommerceError('Reviewed production schema is not ready.',503);
 const preview=await prisma.$queryRawUnsafe<Array<{marker:string|null}>>("SELECT to_regclass('tin_preview.identity')::text marker");
 if(preview[0]?.marker)throw new CommerceError('Preview database cannot accept live payments.',503);
}
export async function paymentReviewGate(){
 if(process.env.VERCEL_ENV==='preview'&&process.env.TIN_ISOLATED_PREVIEW==='1'){
  const raw=process.env.TINTEST_POSTGRES_PRISMA_URL||'';
  let host:string;try{host=new URL(raw).hostname;}catch{throw new CommerceError('Isolated preview database required.',503);}
  if(process.env.POSTGRES_PRISMA_URL!==raw||!host.endsWith('.neon.tech')||host.includes('ep-jolly-shape-a4ni83gl'))throw new CommerceError('Isolated review configuration required.',503);
  if(process.env.TIN_PAYMENTS_TEST_ENABLED==='1')await paymentTestGate();
  const rows=await prisma.$queryRawUnsafe<Array<{id:string;version:number}>>('SELECT i.id,s.version FROM tin_preview.identity i CROSS JOIN tin_payments.schema_version s');
  if(rows.length!==1||rows[0].id!=='customtintacker-preview-test-20261020'||rows[0].version!==1)throw new CommerceError('Synthetic review database required.',503);
  return;
 }
 await paymentExecutionGate();
}
function stripeConfig(){
 if(process.env.VERCEL_ENV==='production')return livePaymentConfig(process.env);
 const key=process.env.TIN_STRIPE_TEST_SECRET_KEY||'',signingSecret=process.env.TIN_STRIPE_TEST_WEBHOOK_SECRET||'',accountId=process.env.TIN_STRIPE_ACCOUNT_ID||'',returnOrigin=process.env.TIN_PAYMENTS_RETURN_ORIGIN||(process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_URL?.startsWith('customtintacker-')?'https://'+process.env.VERCEL_URL:'');
 if(!key.startsWith('sk_test_')||accountId!=='acct_1TO24PIpmMqjUaQp')throw new CommerceError('IG Stripe test configuration required.',503);
 let url:URL;try{url=new URL(returnOrigin);}catch{throw new CommerceError('Approved preview origin required.',503);}
 if(url.protocol!=='https:'||!url.hostname.endsWith('.vercel.app')||url.pathname!=='/'||url.search||url.hash)throw new CommerceError('Approved preview origin required.',503);
 return {key,signingSecret,accountId,returnOrigin,live:false as const};
}
const reviews=()=>paymentReviews(prisma),payments=()=>paymentPostgres(prisma),requestKey=(id:string)=>'invoice-'+id;
async function paymentFor(owner:string,id:string){const rows=await prisma.$queryRawUnsafe<Array<{id:string}>>('SELECT id FROM tin_payments.payment_order WHERE owner_id=$1 AND request_key=$2',owner,requestKey(id));return rows[0]?payments().orderById(owner,rows[0].id):null;}
async function preparedProofs(owner:string,sourceIds:string[]){const rows=await prisma.$queryRawUnsafe<Array<{payload:ProofRevision}>>("SELECT r.payload FROM tin_workflow.revision r JOIN tin_workflow.head h ON h.owner_id=r.owner_id AND h.revision_id=r.id AND h.kind='proof' WHERE r.owner_id=$1 AND r.kind='proof'",owner);return rows.map(r=>r.payload).filter(p=>sourceIds.includes(p.sourceId)).map(p=>({id:p.id,sourceId:p.sourceId,designId:p.designId,version:p.version,printName:p.print.name,embossName:p.emboss?.name}));}
function proofFile(raw:unknown){const f=raw as {name?:unknown;base64?:unknown};if(!f||typeof f.name!=='string'||typeof f.base64!=='string'||!f.base64.length||f.base64.length>4_000_000||!/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64))throw new CommerceError('Valid prepared proof file required.');return {name:f.name,bytes:Uint8Array.from(Buffer.from(f.base64,'base64'))};}
export const paymentActions:PaymentActions={
 async staffView(id){await paymentReviewGate();const invoice=await staffInvoice(id),review=await reviews().get(id),order=await paymentFor(invoice.ownerId,id);return {invoice,proofs:await preparedProofs(invoice.ownerId,invoice.sources.map(s=>s.revisionId)),review,paymentStatus:order?.paid?'paid':order?.sessionId?'awaiting-payment':'not-started',customerPath:'/invoice-payment/'+id};},
 async staffAction(id,body){await paymentReviewGate();const invoice=await staffInvoice(id);
  if(body.action==='prepare-proof'){
   if(await reviews().get(id))throw new CommerceError('Final review already locked; new proof requires staff reconciliation.',409);
   const sourceId=String(body.sourceId||'');if(!invoice.sources.some(s=>s.revisionId===sourceId))throw new CommerceError('Source is not part of this invoice.',403);
   const adapters=postgresAdapters(prisma),blob=vercelPrivateBlobs(process.env.ARTWORK_BLOB_READ_WRITE_TOKEN||'');
   const proof=await publishProof({sourceId,key:String(body.requestKey||''),expectedHead:body.expectedHead===null?null:String(body.expectedHead||''),print:proofFile(body.print),...(body.emboss?{emboss:proofFile(body.emboss)}:{})},{principal:async()=>({ownerId:invoice.ownerId,canPrepareProofs:true}),repository:adapters.storage,blobs:blob,draft:async()=>null,product:async()=>null});
   return {proofId:proof.id,version:proof.version};
  }
  if(body.action==='approve-final'){const input:ReviewInput={shipping:body.shipping as number,tax:body.tax as number,version:String(body.version||''),proofIds:body.proofIds as string[],confirmFinalAmount:body.confirmFinalAmount as true,embossResolutions:body.embossResolutions as ReviewInput['embossResolutions']};const review=await reviews().approve(id,input);return {reviewHash:review.reviewHash,total:review.priced.total,customerPath:'/invoice-payment/'+id};}
  if(body.action==='printiq-review'){const order=await paymentFor(invoice.ownerId,id);if(!order?.paid)throw new CommerceError('Verified payment required before PrintIQ review.',409);return manualHandoff(order);}
  throw new CommerceError('Unknown staff payment action.');
 },
 async acknowledge(id,reviewHash){await paymentReviewGate();const d=await productionContext(),who=await d.principal();if(!await d.invoiceById(id))throw new CommerceError('Invoice request unavailable.',404);return paymentAcknowledgments(prisma).acknowledge(id,who.ownerId,reviewHash);},
 async customerView(id){await paymentReviewGate();const d=await productionContext(),who=await d.principal(),invoice=await d.invoiceById(id);if(!invoice)throw new CommerceError('Invoice request unavailable.',404);const review=await reviews().get(id,who.ownerId),order=await paymentFor(who.ownerId,id);return {reviewHash:review?.reviewHash||null,acknowledged:review?await paymentAcknowledgments(prisma).current(id,who.ownerId,review.reviewHash):false,testMode:process.env.VERCEL_ENV!=='production',checkoutEnabled:!checkoutPaused(process.env)&&(process.env.VERCEL_ENV==='production'||process.env.TIN_PAYMENTS_TEST_ENABLED==='1'),invoiceId:id,businessName:'Interstate Graphics',reviewed:!!review,amounts:review?{merchandise:review.priced.subtotal,setup:review.priced.setup,rush:review.priced.rush,shipping:review.priced.shipping,tax:review.priced.tax,total:review.priced.total}:null,paid:!!order?.paid,productionReleased:false,proofs:review?review.priced.items.map(i=>({designId:i.design.id,preference:i.design.preference,staffResolved:!!review.embossResolutions?.some(r=>r.designId===i.design.id),print:i.design.print,emboss:i.design.emboss})):[]};},
 async checkout(id){requireCheckoutOpen(process.env);await paymentExecutionGate();const d=await productionContext(),who=await d.principal();if(!(await d.invoiceById(id)))throw new CommerceError('Invoice request unavailable.',404);const review=await reviews().get(id,who.ownerId);if(!review)throw new CommerceError('Final staff review is pending.',409);
  await paymentAcknowledgments(prisma).require(id,who.ownerId,review.reviewHash);
  const config=stripeConfig(),store=payments(),order=await store.repository.reserve(who.ownerId,requestKey(id),review.reviewHash,review.priced);
  if(order.paid)return {orderId:order.id,paid:true};if(order.sessionId&&order.checkoutUrl)return reusableCheckout(new Stripe(config.key,{maxNetworkRetries:0,timeout:15000}),order,config.accountId,config.live);
  const started=await store.startSessionAttempt(order.id),client=new Stripe(config.key,{maxNetworkRetries:0,timeout:15000});
  const receipt=await reviewedStripe(client,config).create(order,review.reviewHash,id,started);await store.repository.attachSession(order.id,receipt);return {url:receipt.url};
 },
 async webhook(body,signature){if(process.env.TIN_ISOLATED_PREVIEW==='1')throw new CommerceError('Use the dedicated test webhook receiver.',503);await paymentExecutionGate();const config=stripeConfig(),event=await stripeEventVerifier({signingSecret:config.signingSecret,live:config.live,reviewedOnly:true})(body,signature);if(!event)return {received:true};await payments().repository.commitPaid(event);return {received:true};},
};
/** Staff/customer proof downloads verify the frozen approval and bytes; never return private blob URLs. */
export async function paymentProof(invoiceId:string,artifactId:string){
 await paymentReviewGate();const d=await productionContext(),who=await d.principal();if(!(await d.invoiceById(invoiceId)))throw new CommerceError('Invoice unavailable.',404);
 const review=await reviews().get(invoiceId,who.ownerId);const artifact=review?.priced.items.flatMap(i=>[i.design.print,i.design.emboss]).find(a=>a?.id===artifactId);if(!artifact)throw new CommerceError('Approved proof unavailable.',404);
 const [proofId,kind]=artifact.id.split(':');if(!['print','emboss'].includes(kind))throw new CommerceError('Invalid proof reference.');
 const rows=await prisma.$queryRawUnsafe<Array<{payload:ProofRevision}>>("SELECT payload FROM tin_workflow.revision WHERE owner_id=$1 AND id=$2 AND kind='proof'",who.ownerId,proofId);const proof=rows[0]?.payload,object=kind==='print'?proof?.print:proof?.emboss;
 if(!object||object.sha256!==artifact.sha256)throw new CommerceError('Proof binding mismatch.',409);
 const bytes=await vercelPrivateBlobs(process.env.ARTWORK_BLOB_READ_WRITE_TOKEN||'').read(object.key);if(bytes.length!==object.bytes||createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw new CommerceError('Proof integrity check failed.',503);
 return {bytes,name:object.name.replace(/[^A-Za-z0-9._-]/g,'_')};
}
