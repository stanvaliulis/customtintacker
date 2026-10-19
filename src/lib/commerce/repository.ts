import { randomUUID } from 'node:crypto';
import { CommerceError, hash, type Order, type Repository, type PaidEvent } from './service';
/** Implement with SERIALIZABLE transactions, unique constraints, and retry on
 * serialization conflicts. The callback must roll back in full on any failure. */
export interface CommerceTransaction {
  byRequest(owner: string, key: string): Promise<Order | null>;
  byId(id: string): Promise<Order | null>;
  bySession(session: string): Promise<Order | null>;
  byPayment(payment: string): Promise<Order | null>;
  insert(key: string, order: Order): Promise<void>;
  update(order: Order & { paymentId?: string }): Promise<void>;
  event(id: string): Promise<string | null>;
  insertEvent(id: string, payloadHash: string, orderId: string): Promise<void>;
  enqueueOnce(key: string, paidOrder: Order): Promise<void>;
}
export interface TransactionStore { transaction<T>(work: (tx: CommerceTransaction) => Promise<T>): Promise<T> }
export function transactionalRepository(store: TransactionStore): Repository {
  return {
    reserve: (owner, key, requestHash, snapshot) => store.transaction(async tx => {
      const old = await tx.byRequest(owner, key);
      if (old) { if (old.requestHash !== requestHash) throw new CommerceError('Request key conflict.', 409); return old; }
      const order: Order = { ...snapshot, id: randomUUID(), requestHash, paid: false };
      await tx.insert(key, order); return order;
    }),
    attachSession: (id, session) => store.transaction(async tx => {
      const order = await tx.byId(id), other = await tx.bySession(session.id);
      if (!order || (order.sessionId && order.sessionId !== session.id) || (other && other.id !== id)) throw new Error('Session conflict');
      await tx.update({ ...order, sessionId: session.id, checkoutUrl: session.url });
    }),
    findOwnedSession: (owner, session) => store.transaction(async tx => { const order = await tx.bySession(session); return order?.ownerId === owner ? order : null; }),
    commitPaid: (event: PaidEvent) => store.transaction(async tx => {
      if (event.paymentStatus !== 'paid' || !['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) throw new Error('Not a trusted paid completion event');
      const fingerprint = hash(JSON.stringify(event));
      const receipt = await tx.event(event.id);
      if (receipt) { if (receipt !== fingerprint) throw new Error('Event collision'); return 'duplicate'; }
      const order = await tx.byId(event.orderId), payment = await tx.byPayment(event.paymentIntentId);
      if (!order || order.sessionId !== event.sessionId || order.currency !== event.currency || order.total !== event.total || order.shipping !== event.shipping || order.tax !== event.tax || (payment && payment.id !== order.id)) throw new Error('Payment mismatch');
      const existing = order as Order & { paymentId?: string };
      if (existing.paymentId && existing.paymentId !== event.paymentIntentId) throw new Error('Payment conflict');
      await tx.insertEvent(event.id, fingerprint, order.id);
      if (order.paid) return 'duplicate';
      await tx.update({ ...order, paid: true, paymentId: event.paymentIntentId });
      await tx.enqueueOnce(`paid:${order.id}`, { ...order, paid: true });
      return 'applied';
    }),
  };
}
