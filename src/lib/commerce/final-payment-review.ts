import type { InvoiceRequest } from './invoice';
import { CommerceError, hash, type Artifact, type PricedOrder } from './service';
import { canonical } from '../design/proof-attachment';

export interface FinalPaymentApproval {
 staffId:string; approvedAt:string; version:string; shipping:number; tax:number;
 embossResolutions?:Array<{designId:string;preference:'yes'|'no'}>;
 proofs:Array<{designId:string;sourceHash:string;canvasHash:string;print:Artifact;emboss?:Artifact}>;
}
/** A server-held staff review, never browser-supplied totals or an automatic invoice/charge. */
export function prepareFinalPaymentReview(invoice:InvoiceRequest,approval:FinalPaymentApproval) {
 if(invoice.business!=='IG'||invoice.paid||invoice.productionReleased||invoice.status!=='invoice-requested')
  throw new CommerceError('Unpaid IG invoice request required.',409);
 if(!approval.staffId?.trim()||!approval.version?.trim()||!Number.isFinite(Date.parse(approval.approvedAt))||
   [approval.shipping,approval.tax].some(n=>!Number.isSafeInteger(n)||n<0))
  throw new CommerceError('Staff-approved final shipping and tax required.',409);
 if(!invoice.items.length||approval.proofs.length!==invoice.items.length||invoice.sources.length!==invoice.items.length)
  throw new CommerceError('Every invoice line needs its approved source and proof.',409);
 const resolutions=approval.embossResolutions||[];
 if(!Array.isArray(resolutions)||resolutions.length>invoice.items.length||new Set(resolutions.map(r=>r?.designId)).size!==resolutions.length||
   resolutions.some(r=>!r||!['yes','no'].includes(r.preference)||!invoice.items.some(i=>i.design.id===r.designId&&i.design.preference==='unsure')))
  throw new CommerceError('Resolve only undecided emboss choices explicitly.',409);
 const items=invoice.items.map((item,i)=>{
  const source=invoice.sources[i],proof=approval.proofs[i];
  const preference=item.design.preference==='unsure'?resolutions.find(r=>r.designId===item.design.id)?.preference:item.design.preference;
  if(preference!=='yes'&&preference!=='no')throw new CommerceError('Staff must resolve the emboss choice before final review.',409);
  if(source.designId!==item.design.id||source.sourceHash!==item.design.attachment.sourceHash||
    proof.designId!==item.design.id||proof.sourceHash!==source.sourceHash||proof.canvasHash!==item.design.canvasHash||
    !/^[a-f0-9]{64}$/.test(proof.print?.sha256)||!proof.print.id||!proof.print.version||
    (preference==='yes'&&(!/^[a-f0-9]{64}$/.test(proof.emboss?.sha256||'')||!proof.emboss?.id||!proof.emboss.version)))
   throw new CommerceError('Proof approval does not match the immutable invoice source.',409);
  return {...structuredClone(item),design:{...structuredClone(item.design),preference,approved:true,print:structuredClone(proof.print),
   emboss:preference==='yes'?structuredClone(proof.emboss):undefined}};
 });
 const e=invoice.estimate;
 if(e.currency!=='usd'||[e.merchandise,e.setup,e.rush,e.subtotal].some(n=>!Number.isSafeInteger(n)||n<0)||
   e.subtotal!==e.merchandise+e.setup+e.rush||items.reduce((n,i)=>n+i.unitPrice*i.quantity,0)!==e.merchandise||
   items.reduce((n,i)=>n+i.rush,0)!==e.rush)
  throw new CommerceError('Invoice amount reconciliation required.',409);
 const total=e.subtotal+approval.shipping+approval.tax;
 if(!Number.isSafeInteger(total)||total<=0)throw new CommerceError('Invalid final payment amount.',409);
 const priced:PricedOrder={ownerId:invoice.ownerId,customerName:invoice.customerName,customerEmail:invoice.customerEmail,
  details:structuredClone(invoice.details),business:'IG',policyVersion:'staff-final:'+invoice.id+':'+approval.version,
  paymentTiming:'proof-approved',items,subtotal:e.merchandise,setup:e.setup,rush:e.rush,shipping:approval.shipping,tax:approval.tax,total,currency:'usd'};
 const review={invoiceRequestId:invoice.id,staffId:approval.staffId,approvedAt:approval.approvedAt,version:approval.version,priced,
  ...(resolutions.length?{embossResolutions:structuredClone(resolutions)}:{})};
 return {...review,reviewHash:hash(canonical(review)),execution:'disabled' as const,paid:false as const,productionReleased:false as const};
}
