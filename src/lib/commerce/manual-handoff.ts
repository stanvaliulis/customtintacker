import {CommerceError,type Order} from './service';
/** Read-only staff work packet. Never calls PrintIQ, marks fulfillment or sends mail. */
export function manualHandoff(order:Order){
 if(order.business!=='IG'||!order.paid||order.items.some(i=>!i.design.approved||!i.design.print||(i.design.preference==='yes'&&!i.design.emboss)))throw new CommerceError('Verified payment and approved proofs required.',409);
 return {orderId:order.id,customerName:order.customerName,customerEmail:order.customerEmail,details:order.details,total:order.total,currency:order.currency,productionReleased:false as const,
  instructions:['Confirm customer, delivery details and approved proof versions.','Enter the order in PrintIQ manually using the approved staff process.','Review the PrintIQ entry before authorizing production.'],
  lines:order.items.map(i=>({productId:i.productId,quantity:i.quantity,backingId:i.backingId,printProof:i.design.print!.id,embossProof:i.design.emboss?.id||null}))};
}
