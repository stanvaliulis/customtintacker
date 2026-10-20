import { CommerceError, hash, type Order, type Artifact } from './service';
import { canonical } from '../design/proof-attachment';

export interface ApprovedTackerRecipe {
  version: string; approvedBy: string; approvedAt: string; productId: string; backingId: string;
  widthInches: number; heightInches: number; productCategory: string; sectionType: string;
  foldCatalog: string; stockCode: string; processFront: string; processReverse: string;
  pages: number; emboss: boolean; sectionOperations: string[]; jobOperations: string[];
}
function required(value: string) {
  if (typeof value !== 'string' || !value.trim() || value.length > 200 || /[\r\n]/.test(value))
    throw new CommerceError('Confirmed PrintIQ mapping required.', 503);
  return value;
}
function artifact(a: Artifact | undefined) {
  if (!a || !/^[a-f0-9]{64}$/.test(a.sha256)) throw new CommerceError('Approved immutable artwork hash required.', 409);
  return { id: required(a.id), version: required(a.version), sha256: a.sha256 };
}
/** Review payload only. Never calls GetPrice (which creates a real numbered quote).
 * One line is deliberate: multi-product/add-to-quote retries need a durable receipt contract first.
 */
export function preparePrintIQQuote(order: Order, customerCode: string, recipe: ApprovedTackerRecipe) {
  if (order.business !== 'IG' || !order.paid) throw new CommerceError('Paid IG order required.', 409);
  if (!/^IG-[A-Za-z0-9_-]+$/.test(customerCode)) throw new CommerceError('Verified IG customer mapping required.', 409);
  if (order.items.length !== 1) throw new CommerceError('Multi-line PrintIQ handoff requires staff reconciliation.', 409);
  required(order.id);required(recipe.version);required(recipe.approvedBy);
  if (!Number.isFinite(Date.parse(recipe.approvedAt))) throw new CommerceError('Recipe approval date required.', 503);
  const line = order.items[0], design = line.design;
  if (line.productId !== recipe.productId || line.backingId !== recipe.backingId ||
      !Number.isSafeInteger(line.quantity) || line.quantity < 1 || !design.approved ||
      !/^[a-f0-9]{64}$/.test(design.canvasHash) || !['yes','no'].includes(design.preference) ||
      typeof recipe.emboss !== 'boolean' || recipe.emboss !== (design.preference === 'yes') ||
      !/^[a-f0-9]{64}$/.test(design.attachment?.sourceHash) || design.attachment.designId !== design.id ||
      design.attachment.productId !== line.productId)
    throw new CommerceError('Approved product, quantity and proof mapping required.', 409);
  if (![recipe.widthInches, recipe.heightInches].every(n => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(recipe.pages) || recipe.pages < 1)
    throw new CommerceError('Confirmed recipe dimensions and pages required.', 503);
  const print = artifact(design.print), emboss = design.preference === 'yes' ? artifact(design.emboss) : undefined;
  const size = { FinishSizeWidth: recipe.widthInches, FinishSizeDepth: recipe.heightInches, FinishSizeHeight: 0 };
  const body = {
    CustomerCode: customerCode, JobTitle: `Custom Tin Tackers ${order.id}`, ExternalJobReference: order.id,
    AcceptQuote: false, CreateInvoice: false, CreateInvoiceAsPaid: false, EmailInvoice: false, ExportInvoice: false,
    CustomProduct: { ProductCategory: required(recipe.productCategory), FinishSizeWidth: recipe.widthInches,
      FinishSizeHeight: recipe.heightInches, FinishSize: size,
      Sections: [{ SectionType: required(recipe.sectionType), FoldCatalog: required(recipe.foldCatalog),
        StockCode: required(recipe.stockCode), ProcessFront: required(recipe.processFront), ProcessReverse: required(recipe.processReverse),
        Pages: recipe.pages, SectionSize: { SectionSizeWidth: recipe.widthInches, SectionSizeDepth: recipe.heightInches, SectionSizeHeight: 0 },
        SectionOperations: recipe.sectionOperations.map(name => ({ OperationName: required(name) })) }],
      JobOperations: recipe.jobOperations.map(name => ({ OperationName: required(name) })) },
    SelectedQuantity: { Quantity: line.quantity, Kinds: 1 }, SimpleDetails: true,
  };
  const review = { business: 'IG', externalOrderId: order.id, customerCode, recipe: structuredClone(recipe),
    artwork: { designId: design.id, sourceHash: design.attachment.sourceHash, canvasHash: design.canvasHash, print, emboss }, body };
  return { ...review, reviewHash: hash(canonical(review)), execution: 'disabled' as const,
    warning: 'GetPrice creates a real quote. No automatic retry after an ambiguous response; reconcile by external reference first.' };
}
