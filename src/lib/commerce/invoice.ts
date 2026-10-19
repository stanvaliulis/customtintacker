import {randomUUID} from 'node:crypto';
import {canonical} from '../design/proof-attachment';
import {CommerceError,priceOrder,hash,type Dependencies,type DesignRecord,type PricedOrder} from './service';
import type {NotificationTransport} from './notifications';
export interface InvoiceRequest {
 id:string;ownerId:string;requestHash:string;business:'IG';businessName:'Interstate Graphics';method:'invoice';status:'invoice-requested';paid:false;productionReleased:false;
 customerName:string;customerEmail:string;details:Record<string,string>;items:PricedOrder['items'];sources:Array<{designId:string;revisionId:string;sourceHash:string}>;
 estimate:{currency:'usd';merchandise:number;setup:number;rush:number;subtotal:number;shipping:null;tax:null;finalTotal:null};
}
export interface InvoiceTransaction {
 byRequest(ownerId:string,key:string):Promise<InvoiceRequest|null>;
 /** Insert immutable snapshot; unique(ownerId,key). Assert owned source revisions and hashes in this same transaction. */
 insert(key:string,order:InvoiceRequest):Promise<void>;
 /** Unique notification key, committed atomically with order. Never send inside transaction. */
 enqueueOnce(key:string,order:InvoiceRequest):Promise<void>;
}
export interface InvoiceRepository {
 byRequest(ownerId:string,key:string):Promise<InvoiceRequest|null>;
 commit(key:string,order:InvoiceRequest):Promise<InvoiceRequest>;
}
export function invoiceRepository(store:{transaction<T>(work:(tx:InvoiceTransaction)=>Promise<T>):Promise<T>}):InvoiceRepository {
 return {byRequest:(o,k)=>store.transaction(tx=>tx.byRequest(o,k)),commit:(key,order)=>store.transaction(async tx=>{
  const old=await tx.byRequest(order.ownerId,key);if(old){if(old.requestHash!==order.requestHash)throw new CommerceError('Invoice request key conflict.',409);return old;}
  await tx.insert(key,order);await tx.enqueueOnce('invoice-request:'+order.id,order);return order;
 })};
}
export interface InvoiceDependencies extends Pick<Dependencies,'principal'|'products'|'backings'> {
 /** Resolve authenticated ownership to a durable immutable revision, not local JSON or a mutable draft. */
 design(id:string,ownerId:string):Promise<(DesignRecord&{sourceRevisionId:string;sourceHash:string})|null>;
 repository:InvoiceRepository;
}
export async function requestInvoice(raw:unknown,key:string,d:InvoiceDependencies){
 if(!/^[A-Za-z0-9_-]{16,100}$/.test(key))throw new CommerceError('A stable invoice request key is required.');
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new CommerceError('Invalid invoice request.');
 // Transport anti-spam fields change on reload and must not invalidate a legitimate retry.
 const input=raw as Record<string,unknown>,snapshot=structuredClone(Object.fromEntries(['customerName','name','customerEmail','email','customerPhone','phone','company','notes','shippingAddress','city','state','zip','items'].filter(k=>input[k]!==undefined).map(k=>[k,input[k]])));
 const who=await d.principal();if(!who.ownerId)throw new CommerceError('Verified customer session required.',401);
 const requestHash=hash(canonical({ownerId:who.ownerId,method:'invoice',request:snapshot}));
 const old=await d.repository.byRequest(who.ownerId,key);if(old){if(old.ownerId!==who.ownerId||old.requestHash!==requestHash)throw new CommerceError('Invoice request key conflict.',409);return {orderId:old.id,status:old.status,paid:false as const};}
 const sources:InvoiceRequest['sources']=[];
 // Reuse server catalog, ownership and cart/hash validation. Zero charge placeholders stay internal;
 // invoice requests explicitly expose null shipping/tax/final total until staff prepares an invoice.
 const priced=await priceOrder(snapshot,{...d,principal:async()=>who,design:async(id,ownerId)=>{
  const r=await d.design(id,ownerId);if(!r||!/^src-[a-f0-9]{64}$/.test(r.sourceRevisionId)||!/^[a-f0-9]{64}$/.test(r.sourceHash))throw new CommerceError('Durable artwork revision required.',503);
  sources.push({designId:id,revisionId:r.sourceRevisionId,sourceHash:r.sourceHash});return r;
 },policy:{business:'IG',timing:'upfront',charges:{version:'invoice-request-estimate-v1',calculate:async()=>({shipping:0,tax:0})}},repository:null as unknown as Dependencies['repository'],provider:null as unknown as Dependencies['provider']},false);
 for(let i=0;i<priced.items.length;i++)if(sources[i].sourceHash!==priced.items[i].design.attachment.sourceHash)throw new CommerceError('Immutable source binding mismatch.',409);
 const order:InvoiceRequest={id:randomUUID(),ownerId:who.ownerId,requestHash,business:'IG',businessName:'Interstate Graphics',method:'invoice',status:'invoice-requested',paid:false,productionReleased:false,customerName:priced.customerName,customerEmail:priced.customerEmail,details:priced.details,items:priced.items,sources,estimate:{currency:'usd',merchandise:priced.subtotal,setup:priced.setup,rush:priced.rush,subtotal:priced.subtotal+priced.setup+priced.rush,shipping:null,tax:null,finalTotal:null}};
 const committed=await d.repository.commit(key,order);if(committed.ownerId!==who.ownerId||committed.requestHash!==requestHash||committed.paid!==false||committed.status!=='invoice-requested')throw new CommerceError('Invoice commit receipt mismatch.',503);
 return {orderId:committed.id,status:committed.status,paid:false as const};
}
export function invoiceDependencies():InvoiceDependencies{throw new CommerceError('Invoice requests are not active: authenticated ownership, durable artwork/order transactions and notification delivery must be configured.',503);}
export interface InvoiceJob {key:string;leaseToken:string;attempts:number;order:InvoiceRequest;firstAttemptAt?:number}
export interface InvoiceOutbox {
 claim(now:number,leaseMs:number):Promise<InvoiceJob|null>;
 bindFirstAttempt(job:InvoiceJob,now:number):Promise<number>;
 complete(job:InvoiceJob,messageId:string):Promise<void>;
 retry(job:InvoiceJob,nextAt:number):Promise<void>;
 hold(job:InvoiceJob):Promise<void>;
}
/** Server-only recipient approved by Stan; no customer-controlled destination. */
export const INVOICE_RECIPIENT='sales@customtintackers.com';
export async function deliverNextInvoice(d:{store:InvoiceOutbox;transport:NotificationTransport;now:()=>number}){
 const now=d.now(),job=await d.store.claim(now,60000);if(!job)return 'idle';
 try {
  if(job.order.business!=='IG'||job.order.paid||job.order.status!=='invoice-requested'){await d.store.hold(job);return 'held';}
  const first=await d.store.bindFirstAttempt(job,now);
  if(!Number.isFinite(d.transport.retentionMs)||d.transport.retentionMs<60000||now-first>=d.transport.retentionMs){await d.store.hold(job);return 'held';}
  const o=job.order,text=`Interstate Graphics invoice request ${o.id}\nUNPAID. No invoice sent, no charge taken, no production release.\nStaff review: https://www.customtintackers.com/admin/invoice-requests/${o.id}\nCustomer: ${o.customerName} <${o.customerEmail}>\nDetails: ${JSON.stringify(o.details)}\nEstimate (USD cents): ${JSON.stringify(o.estimate)}\nItems: ${JSON.stringify(o.items)}\nImmutable source revisions: ${JSON.stringify(o.sources)}\nStaff must review artwork and finalize shipping/tax before issuing an invoice.`;
  const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const sent=await d.transport.send({to:[INVOICE_RECIPIENT],subject:`Unpaid IG invoice request ${o.id}`.replace(/[\r\n]/g,' '),text,html:'<pre>'+escape(text)+'</pre>'},job.key);
  if(sent.accepted!==true||!sent.messageId)throw Error('No delivery receipt');await d.store.complete(job,sent.messageId);return 'delivered';
 }catch{await d.store.retry(job,now+Math.min(3600000,1000*2**Math.min(job.attempts,12)));return 'retry';}
}
