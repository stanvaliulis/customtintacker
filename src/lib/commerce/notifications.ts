import type { Order } from './service';
/** Resolved by a server adapter from the SAME active setting used for leads.
 * No historical fallback or customer-provided destination is accepted. */
export interface LeadAudience { addresses: string[]; configurationKey: 'NOTIFICATION_EMAIL'; verifiedActive: true; revision: string }
export interface DeliveryBinding { audience: LeadAudience; firstAttemptAt: number }
export interface NotificationJob { id: string; key: string; leaseToken: string; attempts: number; order: Order; binding?: DeliveryBinding }
export interface NotificationStore {
  // Atomically claim one due undelivered row with an expiring lease and fencing token.
  claim(now: number, leaseMs: number): Promise<NotificationJob | null>;
  // Durable CAS under lease. Existing binding wins, including recipient and first-send time.
  bind(job: NotificationJob, binding: DeliveryBinding): Promise<DeliveryBinding>;
  complete(job: NotificationJob, messageId: string): Promise<void>;
  retry(job: NotificationJob, nextAttemptAt: number, code: string): Promise<void>;
  hold(job: NotificationJob, code: string): Promise<void>;
}
export interface StaffMessage { to: string[]; subject: string; text: string; html: string }
export interface NotificationTransport {
  // Must deduplicate this key for at least retentionMs and throw on ambiguous/failure.
  retentionMs: number;
  send(message: StaffMessage, idempotencyKey: string): Promise<{ accepted: true; messageId: string }>;
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function verifyLeadAudience(value: LeadAudience | null): LeadAudience {
  if (!value || value.configurationKey!=='NOTIFICATION_EMAIL' || value.verifiedActive!==true || !value.revision || !Array.isArray(value.addresses) || !value.addresses.length || value.addresses.length>20 || value.addresses.some(a=>typeof a!=='string'||! /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(a)||/\.invalid$/i.test(a))) throw Error('Active lead recipient is not verified.');
  return {...value,addresses:[...new Set(value.addresses)]};
}
export function completedOrderMessage(order: Order, audience: LeadAudience): StaffMessage {
  if (!order.paid || order.business!=='IG') throw Error('Notification requires an IG paid order.');
  const to=verifyLeadAudience(audience).addresses;
  const lines=order.items.map((i,index)=>[
    `Item ${index+1}: ${i.productId}; qty ${i.quantity}; backing ${i.backingId}; unit cents ${i.unitPrice}; rush cents ${i.rush}`,
    `Saved design: ${i.design.id}; content SHA256 ${i.design.attachment.sourceHash}`,
    `Shared proof: ${i.design.attachment.reviewVersion}; review ${i.design.attachment.reviewStatus}`,
    `Print: ${i.design.attachment.print.intent}; version ${i.design.attachment.print.version}; review ${i.design.attachment.print.reviewStatus}`,
    `Emboss: ${i.design.preference}; elements ${i.design.selectedIds.join(', ')||'(none)'}; version ${i.design.attachment.emboss.version}; review ${i.design.attachment.emboss.reviewStatus}`,
    `Production proof approval: ${i.design.approved?'approved recorded artifacts':'not approved'}; print artifact ${i.design.print?.id||'(not supplied)'}; emboss artifact ${i.design.emboss?.id||'(not supplied)'}`,
  ].join('\n')).join('\n\n');
  const text=[`IG paid order ${order.id}`,`Payment confirmed by trusted paid-event reconciliation. This notification is not production release.`,
    `Customer: ${order.customerName}; ${order.customerEmail}`,`Contact / shipping / notes: ${JSON.stringify(order.details)}`,
    `Currency: ${order.currency}; subtotal cents ${order.subtotal}; setup ${order.setup}; rush ${order.rush}; shipping ${order.shipping}; tax ${order.tax}; paid total ${order.total}`,
    `Payment timing policy: ${order.paymentTiming}; charges policy: ${order.policyVersion}`,`Checkout session: ${order.sessionId||'(unavailable)'}`,lines,
    'Review the attached design references and required proof approval before production. PrintIQ connection does not automatically disable this staff email.'].join('\n\n');
  return {to,subject:`Paid IG order ${order.id}`.replace(/[\r\n]/g,' '),text,html:'<h1>Paid IG order</h1><pre style="white-space:pre-wrap">'+escape(text)+'</pre>'};
}
export async function deliverNextPaidOrder(deps: { store: NotificationStore; transport: NotificationTransport; leadAudience: () => Promise<LeadAudience | null>; now: () => number }) {
  const now=deps.now(),job=await deps.store.claim(now,60000);
  if (!job) return 'idle';
  try {
    if (!job.order.paid || job.order.business!=='IG') { await deps.store.hold(job,'NOT_PAID_IG'); return 'held'; }
    const audience=job.binding?.audience || verifyLeadAudience(await deps.leadAudience());
    const binding=await deps.store.bind(job,{audience,firstAttemptAt:now});
    // If delivery succeeded but its receipt write failed, retry only within the
    // provider's guaranteed deduplication window. Thereafter reconcile manually.
    if (!Number.isFinite(deps.transport.retentionMs) || deps.transport.retentionMs<60000 || now-binding.firstAttemptAt>=deps.transport.retentionMs) { await deps.store.hold(job,'DELIVERY_RECONCILIATION_REQUIRED'); return 'held'; }
    const result=await deps.transport.send(completedOrderMessage(job.order,binding.audience),job.key);
    if (result?.accepted!==true || !result.messageId) throw Error('No provider acceptance receipt');
    await deps.store.complete(job,result.messageId);
    return 'delivered';
  } catch {
    const delay=Math.min(3600000,1000*2**Math.min(job.attempts,12));
    await deps.store.retry(job,now+delay,'DELIVERY_OR_CONFIG_UNCONFIRMED');
    return 'retry';
  }
}
/** Recipient verified from original October 13 lead email headers in connected Outlook. Delivery adapters remain disabled. */
export async function activeLeadAudience(): Promise<LeadAudience | null> { return { addresses: ['web@igiprint.com'], configurationKey: 'NOTIFICATION_EMAIL', verifiedActive: true, revision: 'Outlook-original-quote-2026-10-13' }; }
