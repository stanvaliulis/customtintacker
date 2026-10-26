import type Stripe from 'stripe';
import {CommerceError,type Order} from './service';
/** Retrieve only; never replaces an expired session or retries a payment. */
export async function reusableCheckout(client:Pick<Stripe,'checkout'|'accounts'>,order:Order,accountId:string,live=false){
 if(!order.sessionId||!order.checkoutUrl)throw new CommerceError('Existing checkout required.',409);
 const account=await client.accounts.retrieve();if(account.id!==accountId)throw new CommerceError('Payment account mismatch.',503);
 const s=await client.checkout.sessions.retrieve(order.sessionId);
 if(s.id!==order.sessionId||s.livemode!==live||s.metadata?.orderId!==order.id||s.metadata?.reviewHash!==order.requestHash||s.metadata?.business!=='IG'||s.metadata?.paymentContract!=='reviewed-final-v1'||s.amount_total!==order.total||s.currency!==order.currency)throw new CommerceError('Checkout binding mismatch. Contact staff.',409);
 if(s.status==='complete'||s.payment_status==='paid')throw new CommerceError('Payment confirmation is processing. Refresh status; do not pay again.',409);
 if(s.status!=='open'||s.payment_status!=='unpaid'||!Number.isFinite(s.expires_at)||s.expires_at*1000<=Date.now())throw new CommerceError('This checkout has expired. Contact staff before starting a replacement order.',409);
 if(!s.url||s.url!==order.checkoutUrl||new URL(s.url).origin!=='https://checkout.stripe.com')throw new CommerceError('Checkout destination mismatch.',409);
 return {url:s.url};
}
