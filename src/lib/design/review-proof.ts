import { sourceVersion, sourceWithIntent, type ReviewSource } from './proof-attachment';
import type { ProofLayer } from './proof';
import type { EmbossPreference } from './proof-intent';
export type ProofView = 'print' | 'emboss' | 'overlay';
export interface ReviewInput { source?: ReviewSource; image: string; layers: ProofLayer[]; preference: EmbossPreference; selected: number[]; width: number; height: number; trimPath: string }
export const EMBOSS_GREEN = '#16a34a';
export const DIE_MAGENTA = '#d946ef';
export const xml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
/** Label-based hint only, not an image barcode detector. */
export function identifiedQR(layer: ProofLayer) { return /\bqr(?:[\s_-]*code)?\b/i.test(layer.label); }
export function maskLayers(input: ReviewInput) { return input.preference === 'yes' ? input.layers.filter((l,i) => input.selected.includes(i) && l.maskSvg && !identifiedQR(l)) : []; }
/** Stable review identifier, not an approval signature or security checksum. */
export function reviewVersion(input: ReviewInput) {
  if(input.source) return sourceVersion(sourceWithIntent(input.source,input.preference,input.layers.filter((_,i)=>input.selected.includes(i)).map(l=>l.id!).filter(Boolean)));
  const source = JSON.stringify([input.width,input.height,input.trimPath,input.image,input.preference,input.layers.map((l,i)=>[l.id,l.maskSvg,input.selected.includes(i)])]);
  let n=2166136261; for(let i=0;i<source.length;i++) n=Math.imul(n^source.charCodeAt(i),16777619);
  return 'POP-'+(n>>>0).toString(16).padStart(8,'0').toUpperCase();
}
export function reviewSVG(input: ReviewInput, view: ProofView, guides: boolean) {
  if (![input.width,input.height].every(n=>Number.isFinite(n)&&n>0&&n<=120)) throw Error('Invalid review dimensions.');
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(input.image)) throw Error('Review artwork must be an embedded PNG.');
  const w=input.width*72,h=input.height*72,v=reviewVersion(input),trim=xml(input.trimPath);
  const mask=maskLayers(input).map(l=>l.maskSvg).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}in" height="${input.height}in" viewBox="0 0 ${w} ${h}"><title>${v} ${view} - customer/team review proof</title><desc>Unapproved. Green means requested embossing; magenta is the existing layout die-line guide. RGB review only; no PDF spot separations. No added bleed or inferred mounting holes.</desc><defs><clipPath id="layout"><path d="${trim}"/></clipPath><filter id="green" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse"><feFlood flood-color="${EMBOSS_GREEN}"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs><rect width="${w}" height="${h}" fill="white"/><g clip-path="url(#layout)">${view !== 'emboss' ? `<image href="${input.image}" x="0" y="0" width="${w}" height="${h}"/>` : ''}${view !== 'print' ? `<g filter="url(#green)" opacity="${view==='overlay'?0.65:1}">${mask}</g>` : ''}</g>${guides?`<path data-guide="layout-trim" d="${trim}" fill="none" stroke="${DIE_MAGENTA}" stroke-width="3"/>`:''}</svg>`;
}
export function reviewManifest(input: ReviewInput, guides: boolean) {
  return {format:'customer-team-review',version:reviewVersion(input),status:'unapproved',widthInches:input.width,heightInches:input.height,coordinates:'72 units per inch; identical origin and trim in all three views',guides,guideSource:'existing product layout; not a newly verified production die',embossPreference:input.preference,requestedIds:input.layers.filter((_,i)=>input.selected.includes(i)).map(l=>l.id),renderedMaskIds:maskLayers(input).map(l=>l.id),excludedQRIds:input.layers.filter((l,i)=>input.selected.includes(i)&&identifiedQR(l)).map(l=>l.id),separations:'RGB SVG review, not PDF spot colors',printApproval:'not approved',embossApproval:'not approved',limitations:['Print artwork is embedded raster preview.','Text is not converted to outlines.','No automatic path union, expansion or photo tracing.','QR identification is label-based; inspect QR codes in uploaded images manually.','No added production bleed or mounting holes.']};
}
export function pairedReviewHTML(input: ReviewInput, guides: boolean) {
  const version=reviewVersion(input);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${version} paired POP review</title><style>body{font:16px system-ui;margin:24px;background:#f1f5f9;color:#172033}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}article{background:white;padding:16px;border:1px solid #cbd5e1;border-radius:12px}svg{width:100%;height:auto;max-height:70vh}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}p{line-height:1.5}</style><h1>Customer / team review proof</h1><p>${version} · ${input.width} × ${input.height} inches · Not approved</p><p>Green: requested embossing. Magenta: layout die-line guide. Check artwork and raised areas with the team. QR codes should stay flat. RGB review files, not production spot-color separations.</p><main>${(['print','emboss','overlay'] as ProofView[]).map(view=>`<article><h2>${view==='emboss'?'Emboss Mask':view==='print'?'Print':'Overlay'}</h2>${reviewSVG(input,view,guides)}</article>`).join('')}</main><h2>Review record</h2><pre>${xml(JSON.stringify(reviewManifest(input,guides),null,2))}</pre></html>`;
}
