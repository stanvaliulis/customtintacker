import { MAX_DESIGN_BYTES, validateCanvas } from './document';
import { readProofIntent } from './proof-intent';
import { proofNotes, type ProofLayer } from './proof';

/** Reconstruct from the existing saved-design record; no session-storage dependency. */
export function recoverSavedProof(value: unknown, expectedId: string) {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved design.');
  const record = value as { id?: unknown; canvasJson?: unknown };
  if (record.id !== expectedId || typeof record.canvasJson !== 'string' || record.canvasJson.length > MAX_DESIGN_BYTES) throw new Error('The saved design did not match this request.');
  const canvas = JSON.parse(record.canvasJson);
  if (!canvas || typeof canvas !== 'object') throw new Error('Invalid saved design.');
  validateCanvas(canvas);
  if(canvas.guidedUpload){const p=canvas.guidedUpload;return {preference:readProofIntent(canvas).preference,selectedIds:p.embossPreference==='suggested'?p.selectedRegions:[],notes:p.notes+'\nGuided upload: customer direction only; production approval pending.'};}
  if (!canvas.proofIntent) throw new Error('This older design has no saved embossing preference. Reopen and save it in the editor, or enter your preference below.');
  const layers: ProofLayer[] = [];
  const visit = (objects: Record<string, unknown>[]) => objects.forEach(object => {
    layers.push({ id: typeof object.proofId === 'string' ? object.proofId : undefined, embossRequested: object.embossRequested === true,
      label: String(object.text || object.type || 'Artwork').slice(0, 70), type: String(object.type), left: Number(object.left) || 0, top: Number(object.top) || 0, width: Number(object.width) || 0, height: Number(object.height) || 0 });
    if (Array.isArray(object.objects)) visit(object.objects as Record<string, unknown>[]);
  });
  visit(canvas.objects);
  const selected = layers.flatMap((layer, i) => layer.embossRequested ? [i] : []);
  const preference = readProofIntent(canvas).preference;
  return { preference, selectedIds: selected.map(i => layers[i].id!), notes: proofNotes(layers, selected, preference) };
}
