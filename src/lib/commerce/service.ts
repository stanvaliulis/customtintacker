import { savedAttachment, attachmentMatches, type ProofAttachment } from '../design/proof-attachment';
import { createHash } from 'node:crypto';
import type { Product, BackingConfig } from '../../types/product';
import { getResellerUnitPrice } from '../utils';
import { recoverSavedProof } from '../design/saved-proof';

export class CommerceError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export interface Principal { ownerId: string; role?: string; discountTier?: number }
export interface Artifact { id: string; sha256: string; version: string }
export interface DesignRecord { id: string; ownerId: string; productId: string; shape: string; width: number; height: number; canvasJson: string; print?: Artifact; emboss?: Artifact; approval?: { canvasHash: string; printHash: string; embossHash?: string; approvedAt: string } }
export interface Policy {
  business: 'IG' | 'CP' | null;
  timing: 'upfront' | 'proof-approved' | null;
  // Server-owned, versioned policy functions. Null means unresolved, never zero.
  charges: null | { version: string; calculate: (subtotal: number, request: Record<string, unknown>) => Promise<{ shipping: number; tax: number }> };
}
export interface PricedOrder {
  ownerId: string; customerName: string; customerEmail: string; details: Record<string, string>; business: 'IG' | 'CP'; policyVersion: string; paymentTiming: 'upfront' | 'proof-approved';
  items: Array<{ productId: string; quantity: number; backingId: string; unitPrice: number; rush: number; design: { id: string; canvasHash: string; preference: string; selectedIds: string[]; print?: Artifact; emboss?: Artifact; approved: boolean; attachment: ProofAttachment } }>;
  subtotal: number; setup: number; rush: number; shipping: number; tax: number; total: number; currency: 'usd';
}
export interface Order extends PricedOrder { id: string; requestHash: string; sessionId?: string; checkoutUrl?: string; paid: boolean }
export interface PaidEvent { id: string; type: string; sessionId: string; orderId: string; paymentIntentId: string; paymentStatus: string; currency: string; total: number; shipping: number; tax: number; reviewHash?:string }
export interface Repository {
  // Durable unique(ownerId,key); conflict if hash differs. Must never reset existing state.
  reserve(ownerId: string, key: string, hash: string, order: PricedOrder): Promise<Order>;
  attachSession(orderId: string, session: { id: string; url: string }): Promise<void>;
  findOwnedSession(ownerId: string, sessionId: string): Promise<Order | null>;
  // ONE transaction: event ID uniqueness + session/payment uniqueness + amount/currency
  // match + unpaid->paid transition + one outbox record. Roll back every write on failure.
  commitPaid(event: PaidEvent): Promise<'applied' | 'duplicate'>;
}
export interface Dependencies {
  policy: Policy; repository: Repository;
  principal(): Promise<Principal>;
  products(): Promise<Product[]>; backings: BackingConfig[];
  design(id: string, ownerId: string): Promise<DesignRecord | null>;
  provider: {
    create(order: Order, idempotencyKey: string): Promise<{ id: string; url: string }>;
    verify(body: string, signature: string): Promise<PaidEvent>;
  };
}
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
function text(value: unknown, label: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new CommerceError(`Invalid ${label}.`);
  return value.trim();
}
function cents(value: number) { if (!Number.isSafeInteger(value) || value < 0) throw new CommerceError('Invalid server price.', 503); return value; }
export async function priceOrder(raw: unknown, d: Dependencies, forPayment = true): Promise<PricedOrder> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new CommerceError('Invalid order.');
  const b = raw as Record<string, unknown>;
  const who = await d.principal();
  if (!who.ownerId) throw new CommerceError('Verified customer session required.', 401);
  const name = text(b.customerName ?? b.name, 'name', 200);
  const email = text(b.customerEmail ?? b.email, 'email', 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CommerceError('Invalid email.');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) throw new CommerceError('Invalid cart.');
  const details: Record<string, string> = {};
  for (const field of ['customerPhone', 'phone', 'company', 'notes', 'shippingAddress', 'city', 'state', 'zip']) {
    const value = b[field];
    if (value !== undefined && value !== '') details[field] = text(value, field, field === 'notes' ? 2000 : 300);
  }
  const products = await d.products();
  const items: PricedOrder['items'] = [];
  const unique = new Set<string>();
  let subtotal = 0, rush = 0, setup = 0;
  for (const rawItem of b.items) {
    if (!rawItem || typeof rawItem !== 'object') throw new CommerceError('Invalid item.');
    const i = rawItem as Record<string, unknown>;
    const p = products.find(p => p.id === i.productId);
    if (!p || !p.inStock) throw new CommerceError('Product unavailable.');
    const q = i.quantity;
    if (typeof q !== 'number' || !Number.isSafeInteger(q) || q < 1 || q > 1000000) throw new CommerceError('Invalid quantity.');
    const tier = p.pricingTiers.find(t => q >= t.minQuantity && (t.maxQuantity === null || q <= t.maxQuantity));
    const backing = d.backings.find(x => x.id === i.backingId && p.backingOptions.includes(x.id));
    if (!tier || !backing) throw new CommerceError('Invalid price tier or backing.');
    if (i.priceTier !== undefined && !['retail', 'distributor'].includes(String(i.priceTier))) throw new CommerceError('Invalid price tier.');
    if (i.isRush !== undefined && typeof i.isRush !== 'boolean') throw new CommerceError('Invalid rush option.');
    const reseller = ['distributor', 'wholesale'].includes(who.role || '') && i.priceTier === 'distributor';
    const discount = who.discountTier ?? 0.40;
    if (!Number.isFinite(discount) || discount < 0 || discount > 1) throw new CommerceError('Invalid account pricing.', 503);
    const unitPrice = cents(reseller ? getResellerUnitPrice(tier, backing.priceMultiplier, discount) : Math.round(tier.pricePerUnit * backing.priceMultiplier));
    const line = cents(unitPrice * q), rushLine = i.isRush ? cents(Math.round(line * 0.25)) : 0;
    const id = text(i.designId, 'saved design reference', 200);
    const record = await d.design(id, who.ownerId);
    if (!record || record.id !== id || record.ownerId !== who.ownerId || record.productId !== p.id) throw new CommerceError('Design unavailable for this customer/product.', 403);
    const attachment = await savedAttachment(record, p.id);
    if (!attachmentMatches(i.proofAttachment, attachment)) throw new CommerceError('Attached proof is stale or mismatched. Review and attach the current saved design.', 409);
    if (record.shape !== p.shape || record.width !== p.dimensions.width || record.height !== p.dimensions.height) throw new CommerceError('Design dimensions do not match this product.', 409);
    const proof = recoverSavedProof(record, id), canvasHash = hash(record.canvasJson);
    // Approval is server-held and bound to immutable versions, never a browser boolean.
    const approved = !!record.print && !!record.approval && record.approval.canvasHash === canvasHash && record.approval.printHash === record.print.sha256 && (proof.preference !== 'yes' || (!!record.emboss && record.approval.embossHash === record.emboss.sha256));
    if (forPayment && d.policy.timing === 'proof-approved' && !approved) throw new CommerceError('Approved print and emboss proof versions required.', 409);
    items.push({ productId: p.id, quantity: q, backingId: backing.id, unitPrice, rush: rushLine, design: { id, canvasHash, preference: proof.preference, selectedIds: proof.selectedIds, print: record.print, emboss: record.emboss, approved, attachment } });
    subtotal = cents(subtotal + line); rush = cents(rush + rushLine);
    if (!unique.has(p.id)) { setup = cents(setup + p.setupFee); unique.add(p.id); }
  }
  if (!d.policy.business || !d.policy.timing || !d.policy.charges) throw new CommerceError('Business, payment timing, shipping and tax policy require approval.', 503);
  const charges = await d.policy.charges.calculate(cents(subtotal + setup + rush), b);
  const shipping = cents(charges.shipping), tax = cents(charges.tax);
  return { ownerId: who.ownerId, customerName: name, customerEmail: email, details, business: d.policy.business, policyVersion: d.policy.charges.version, paymentTiming: d.policy.timing, items, subtotal, setup, rush, shipping, tax, total: cents(subtotal + setup + rush + shipping + tax), currency: 'usd' };
}
export async function checkout(raw: unknown, requestKey: string, d: Dependencies, pay = true) {
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(requestKey)) throw new CommerceError('A stable checkout request key is required.');
  const priced = await priceOrder(raw, d, pay);
  const order = await d.repository.reserve(priced.ownerId, requestKey, hash(JSON.stringify(priced)), priced);
  if (!pay) return { orderId: order.id, status: order.paid ? 'paid' : 'pending' };
  if (order.paid) return { orderId: order.id, status: 'paid' };
  if (order.sessionId && order.checkoutUrl) return { orderId: order.id, url: order.checkoutUrl };
  const session = await d.provider.create(order, `checkout:${order.id}`);
  // If this save fails, return failure. Retry reuses the durable order and provider key.
  await d.repository.attachSession(order.id, session);
  return { orderId: order.id, url: session.url };
}
export async function webhook(body: string, signature: string, d: Dependencies) {
  if (!signature) throw new CommerceError('Missing signature.');
  const event = await d.provider.verify(body, signature);
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return { received: true };
  if (event.paymentStatus !== 'paid') return { received: true, pending: true };
  if (!event.id || !event.orderId || !event.sessionId || !event.paymentIntentId) throw new CommerceError('Incomplete payment event.');
  await d.repository.commitPaid(event);
  return { received: true };
}
export async function status(sessionId: string, d: Dependencies) {
  if (!/^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId)) throw new CommerceError('Invalid checkout session.');
  const who = await d.principal();
  if (!who.ownerId) throw new CommerceError('Verified customer session required.', 401);
  const order = await d.repository.findOwnedSession(who.ownerId, sessionId);
  if (!order) throw new CommerceError('Checkout session not found.', 404);
  return { orderId: order.id, status: order.paid ? 'paid' : 'pending' };
}
