import type Stripe from 'stripe';
import {CommerceError,type Order} from './service';
/** One fixed final amount: staff's shipping/tax are included, never recalculated by Stripe Tax. */
export function reviewedStripe(client:Pick<Stripe,'accounts'|'checkout'>,config:{accountId:string;returnOrigin:string;live?:boolean;now?:()=>number}){
 const origin=new URL(config.returnOrigin);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash)throw new CommerceError('Verified HTTPS return origin required.',503);
 const now=config.now||Date.now;
 return {create:async(order:Order,reviewHash:string,invoiceId:string,started:number)=>{
  if(order.business!=='IG'||order.paid||order.currency!=='usd'||order.paymentTiming!=='proof-approved'||
    !/^[a-f0-9]{64}$/.test(reviewHash)||!Number.isSafeInteger(order.total)||order.total<50||
    order.total!==order.subtotal+order.setup+order.rush+order.shipping+order.tax||
    !Number.isFinite(started)||started>now()+1000||now()-started>22*60*60*1000)
    throw new CommerceError('Reviewed payment requires staff reconciliation.',409);
  const account=await client.accounts.retrieve();if(account.id!==config.accountId)throw new CommerceError('Stripe account mismatch.',503);
  const metadata={business:'IG',orderId:order.id,paymentContract:'reviewed-final-v1',reviewHash,shippingCents:String(order.shipping),taxCents:String(order.tax)};
  const result=await client.checkout.sessions.create({mode:'payment',payment_method_types:['card'],
   line_items:[{price_data:{currency:'usd',unit_amount:order.total,product_data:{name:'Approved Custom Tin Tackers order',
    description:`Includes approved shipping $${(order.shipping/100).toFixed(2)} and tax $${(order.tax/100).toFixed(2)}. Interstate Graphics.`}},quantity:1}],
   metadata,payment_intent_data:{metadata},automatic_tax:{enabled:false},allow_promotion_codes:false,
   invoice_creation:{enabled:false},expires_at:Math.floor(started/1000)+23*60*60,
   success_url:origin.origin+'/invoice-payment/'+encodeURIComponent(invoiceId)+'?returned=1',
   cancel_url:origin.origin+'/invoice-payment/'+encodeURIComponent(invoiceId),
  },{idempotencyKey:'reviewed-payment:'+order.id});
  if(result.livemode!==(config.live===true)||!result.id.startsWith(config.live?'cs_live_':'cs_test_')||!result.url||new URL(result.url).origin!=='https://checkout.stripe.com'||
    result.amount_total!==order.total||result.currency!=='usd'||result.metadata?.reviewHash!==reviewHash)
    throw new CommerceError('Stripe session receipt mismatch; staff reconciliation required.',503);
  return {id:result.id,url:result.url};
 }};
}
