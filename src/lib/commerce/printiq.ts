import { CommerceError, type Order } from './service';
export interface PrintIQSubmission {
  company: 'IG'; externalOrderId: string; recipeId: string;
  lines: Array<{ productId: string; quantity: number; backingId: string; designId: string; canvasHash: string; printArtifactId: string; embossArtifactId?: string }>;
}
export interface PrintIQAdapter {
  submitApprovedOrder(submission: PrintIQSubmission): Promise<{ quoteId: string; jobId?: string }>;
}
/** No endpoint calls, credentials, guessed recipe, tenant or merchant identifiers. */
export const disabledPrintIQ: PrintIQAdapter = {
  async submitApprovedOrder() { throw new CommerceError('PrintIQ writes disabled pending approved recipe and integration authorization.', 503); },
};
export function printIQSubmission(order: Order, recipeId: string | null): PrintIQSubmission {
  if (order.business !== 'IG') throw new CommerceError('CustomTinTackers orders must belong to IG.');
  if (!order.paid) throw new CommerceError('Payment reconciliation required.', 409);
  if (!recipeId) throw new CommerceError('No approved PrintIQ tacker recipe.', 503);
  if (order.items.some(i => !i.design.approved || !i.design.print || (i.design.preference === 'yes' && !i.design.emboss))) throw new CommerceError('Separate approved print and emboss versions required.', 409);
  return { company: 'IG', externalOrderId: order.id, recipeId, lines: order.items.map(i => ({ productId: i.productId, quantity: i.quantity, backingId: i.backingId, designId: i.design.id, canvasHash: i.design.canvasHash, printArtifactId: i.design.print!.id, embossArtifactId: i.design.emboss?.id })) };
}
