import { validateCanvas } from './document';
import { recoverSavedProof } from './saved-proof';
import type { EmbossPreference } from './proof-intent';
export interface ReviewSource { productId: string; shape: string; width: number; height: number; canvas: Record<string, unknown> }
export interface ProofAttachment {
  workflow?: 'upload';
  designId: string; productId: string; sourceHash: string; reviewVersion: string; reviewStatus: 'unapproved';
  print: { intent: 'saved-artwork'; version: string; reviewStatus: 'unapproved' };
  emboss: { preference: EmbossPreference; selectedIds: string[]; version: string; reviewStatus: 'unapproved' };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value==='object') return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
  return JSON.stringify(value);
}
export function sourceWithIntent(source: ReviewSource, preference: EmbossPreference, selectedIds: string[]): ReviewSource {
  const canvas=JSON.parse(JSON.stringify(source.canvas));
  canvas.proofIntent={version:1,status:'unapproved',preference};
  canvas.objects.forEach((o:Record<string,unknown>)=>{o.embossRequested=preference==='yes'&&selectedIds.includes(String(o.proofId));});
  return {...source,canvas};
}
export function sourceVersion(source: ReviewSource) {
  let n=2166136261;const value=canonical(source);for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);
  return 'POP-'+(n>>>0).toString(16).padStart(8,'0').toUpperCase();
}
export function sourceFromRecord(record: { productId: string; shape: string; width: number; height: number; canvasJson: string }): ReviewSource {
  if (!record.productId || !record.shape || ![record.width,record.height].every(n=>Number.isFinite(n)&&n>0&&n<=120))throw Error('Invalid saved design dimensions.');
  const canvas=JSON.parse(record.canvasJson);validateCanvas(canvas);
  const source={productId:record.productId,shape:record.shape,width:record.width,height:record.height,canvas};
  if(canvas.guidedUpload){const p=canvas.guidedUpload.product;if(p.id!==record.productId||p.shape!==record.shape||p.width!==record.width||p.height!==record.height)throw Error('Guided review product does not match saved record.');return source;}
  return sourceWithIntent(source,canvas.proofIntent?.preference || 'unsure',canvas.objects.filter((o:Record<string,unknown>)=>o.embossRequested===true).map((o:Record<string,unknown>)=>String(o.proofId)));
}
export async function savedAttachment(record: {id:string;productId:string;shape:string;width:number;height:number;canvasJson:string}, productId: string, expectedVersion?: string): Promise<ProofAttachment> {
  if(record.productId!==productId)throw Error('Saved design belongs to a different product.');
  const source=sourceFromRecord(record),proof=recoverSavedProof(record,record.id),reviewVersion=sourceVersion(source);
  if(expectedVersion&&expectedVersion!==reviewVersion)throw Error('Design changed since review. Reopen the proof and attach its current version.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(source)));
  const sourceHash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
  return {...(source.canvas.guidedUpload?{workflow:'upload' as const}:{}),designId:record.id,productId,sourceHash,reviewVersion,reviewStatus:'unapproved',print:{intent:'saved-artwork',version:reviewVersion,reviewStatus:'unapproved'},emboss:{preference:proof.preference,selectedIds:proof.selectedIds,version:reviewVersion,reviewStatus:'unapproved'}};
}
/** Attachment is untrusted browser input until re-derived from the owned saved record. */
export function attachmentMatches(value: unknown, expected: ProofAttachment) { return canonical(value)===canonical(expected); }
