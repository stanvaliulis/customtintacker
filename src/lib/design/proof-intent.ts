/** Optional v1 metadata in existing canvasJson. Intent only, never approved tooling. */
export type EmbossPreference = 'yes' | 'no' | 'unsure';
export interface ProofIntent { version: 1; status: 'unapproved'; preference: EmbossPreference; }
export interface IntentElement { proofId?: string; embossRequested?: boolean; objects?: object[]; getObjects?: () => object[]; }
export const PROOF_PROPERTIES = ['proofId', 'embossRequested'];
export function ensureProofIds(objects: object[], fresh = false) {
  const seen = new Set<string>();
  const visit = (items: object[]) => items.forEach(item => {
    const element = item as IntentElement;
    if (fresh || !element.proofId || seen.has(element.proofId)) element.proofId = crypto.randomUUID();
    seen.add(element.proofId);
    const children = element.getObjects?.() || element.objects;
    if (children) visit(children);
  });
  visit(objects);
}
export function readProofIntent(canvas: object): ProofIntent {
  return (canvas as { proofIntent?: ProofIntent }).proofIntent || { version: 1, status: 'unapproved', preference: 'unsure' };
}
export function writeProofIntent(canvas: object, objects: object[], preference: EmbossPreference, selectedIds: string[]) {
  ensureProofIds(objects);
  const selected = new Set(selectedIds);
  objects.forEach(item => { const element = item as IntentElement; element.embossRequested = preference === 'yes' && selected.has(element.proofId!); });
  (canvas as { proofIntent: ProofIntent }).proofIntent = { version: 1, status: 'unapproved', preference };
}
export function validateProofMetadata(canvas: Record<string, unknown>) {
  const value = canvas.proofIntent as Partial<ProofIntent> | undefined;
  if (value !== undefined && (!value || value.version !== 1 || value.status !== 'unapproved' || !['yes','no','unsure'].includes(value.preference || ''))) throw new Error('Unsupported proof intent metadata. Your original file has been kept.');
  const seen = new Set<string>();
  const visit = (objects: unknown[], depth: number) => {
    if (depth > 12) throw new Error('Too many nested proof elements.');
    for (const raw of objects) {
      if (!raw || typeof raw !== 'object') continue;
      const element = raw as IntentElement;
      if (element.proofId !== undefined) {
        if (typeof element.proofId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(element.proofId) || seen.has(element.proofId)) throw new Error('Invalid or duplicate proof element ID.');
        seen.add(element.proofId);
      }
      if (element.embossRequested !== undefined && typeof element.embossRequested !== 'boolean') throw new Error('Invalid embossing intent.');
      if (element.embossRequested && !element.proofId) throw new Error('Embossing intent needs an element ID.');
      if (Array.isArray(element.objects)) visit(element.objects, depth + 1);
    }
  };
  if (Array.isArray(canvas.objects)) visit(canvas.objects, 0);
}
