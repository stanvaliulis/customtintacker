import Stripe from 'stripe';
import { CommerceError, type PaidEvent } from './service';

/** Disconnected verifier. No client/key, API call, route wiring or payment activation. */
export function stripeEventVerifier(config: { signingSecret: string; live: boolean }) {
  if (!config.signingSecret.startsWith('whsec_') || config.signingSecret.length < 16)
    throw new CommerceError('Stripe webhook signing configuration required.', 503);
  return async (body: string, signature: string): Promise<PaidEvent | null> => {
    if (!signature || Buffer.byteLength(body, 'utf8') > 1024 * 1024)
      throw new CommerceError('Invalid payment event.', 400);
    let event: Stripe.Event;
    try { event = Stripe.webhooks.constructEvent(body, signature, config.signingSecret, 300); }
    catch { throw new CommerceError('Invalid payment signature.', 400); }
    // Direct IG account only. Connect events require a separate approved account contract.
    if (event.livemode !== config.live || event.account)
      throw new CommerceError('Payment event account or mode mismatch.', 400);
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return null;
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== 'payment' || session.livemode !== config.live || session.metadata?.business !== 'IG')
      throw new CommerceError('Payment event business or mode mismatch.', 400);
    if (session.payment_status !== 'paid') return null;
    const payment = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const orderId = session.metadata?.orderId;
    const total = session.amount_total, subtotal = session.amount_subtotal;
    const shipping = session.total_details?.amount_shipping, tax = session.total_details?.amount_tax;
    const discount = session.total_details?.amount_discount;
    if (!event.id || !session.id?.startsWith('cs_') || !payment?.startsWith('pi_') ||
        !orderId || !/^[A-Za-z0-9_-]{1,200}$/.test(orderId) || session.currency !== 'usd' ||
        [total, subtotal, shipping, tax, discount].some(n => typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) ||
        discount !== 0 || total !== subtotal! + shipping! + tax!)
      throw new CommerceError('Incomplete or inconsistent payment event.', 400);
    return { id: event.id, type: event.type, sessionId: session.id, orderId, paymentIntentId: payment,
      paymentStatus: 'paid', currency: 'usd', total: total!, shipping: shipping!, tax: tax! };
  };
}
