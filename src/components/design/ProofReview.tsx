'use client';
import { useEffect, useRef, useState } from 'react';
import { reviewWarnings, type ProofLayer } from '@/lib/design/proof';
import { identifiedQR, pairedReviewHTML, reviewManifest, reviewSVG, reviewVersion, type ProofView } from '@/lib/design/review-proof';
import type { ReviewSource } from '@/lib/design/proof-attachment';
import type { EmbossPreference } from '@/lib/design/proof-intent';
export interface ProofSnapshot { image: string; layers: ProofLayer[]; preference: EmbossPreference; trimPath: string; source?: ReviewSource }
export default function ProofReview({ snapshot, width, height, onClose, onRequest, onIntentChange, onAttach, canAttach, busy }: {
 snapshot: ProofSnapshot; width: number; height: number; onClose: () => void; onRequest: () => Promise<unknown>;
 onAttach: (version: string) => Promise<void>; canAttach: boolean;
 onIntentChange: (preference: EmbossPreference, selectedIds: string[]) => void; busy: boolean;
}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [selected,setSelected]=useState<number[]>(()=>snapshot.layers.flatMap((l,i)=>l.embossRequested?[i]:[]));
 const [preference,setPreference]=useState<EmbossPreference>(snapshot.preference);
 const [view,setView]=useState<ProofView>('print'),[guides,setGuides]=useState(true);
 useEffect(()=>{dialog.current?.showModal();},[]);
 const input={...snapshot,width,height,selected,preference}, version=reviewVersion(input);
 const change=(p:EmbossPreference,indices:number[])=>{setPreference(p);setSelected(indices);onIntentChange(p,indices.map(i=>snapshot.layers[i].id!).filter(Boolean));};
 const download=(content:string,suffix:string,mime:string)=>{const url=URL.createObjectURL(new Blob([content],{type:mime}));const link=document.createElement('a');link.href=url;link.download=version+'-'+suffix;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="proof-title" className="m-auto w-[min(1100px,calc(100%_-_24px))] max-h-[94dvh] overflow-y-auto rounded-2xl bg-gray-950 text-gray-100 border border-gray-700 p-0 backdrop:bg-black/70">
  <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-950 px-4 py-3"><div><p className="text-xs text-amber-300">CUSTOMER / TEAM REVIEW</p><h2 id="proof-title" className="font-semibold">Print & raised areas</h2></div><button autoFocus onClick={onClose} className="min-h-11 px-3 rounded-lg border border-gray-700">Close</button></header>
  <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
   <div className="p-3 sm:p-5 bg-gray-900 min-w-0">
    <div className="grid grid-cols-3 gap-2 mb-3" aria-label="Proof views">{(['print','emboss','overlay'] as ProofView[]).map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)} className={`min-h-11 rounded-lg border px-2 text-sm ${view===v?'border-amber-400 bg-amber-500/15 text-amber-200':'border-gray-600'}`}>{v==='emboss'?'Emboss Mask':v==='print'?'Print':'Overlay'}</button>)}</div>
    {/* Embedded local artwork only. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(reviewSVG(input,view,guides))} alt={`${view==='emboss'?'Emboss Mask':view} review ${version}, ${width} by ${height} inches`} className="w-full max-h-[48dvh] object-contain bg-white rounded-lg"/>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3"><span className="text-green-400">● Green: requested emboss</span><span className="text-fuchsia-400">━ Magenta: die-line guide</span></div>
    <label className="flex items-center gap-2 min-h-11 text-sm"><input type="checkbox" checked={guides} onChange={e=>setGuides(e.target.checked)}/>Show layout die-line guide</label>
    <p className="text-xs text-gray-300">{width} × {height} in · {version} · Unapproved</p><p className="text-xs text-gray-400 mt-2">All views share the same size and position. The guide follows this product’s editor shape. Mounting holes and bleed are not added.</p>
   </div>
   <div className="p-4 space-y-3">
    <div><label htmlFor="proof-emboss" className="text-sm font-medium">Embossing preference</label><select id="proof-emboss" value={preference} onChange={e=>{const p=e.target.value as EmbossPreference;change(p,p==='yes'?selected:[]);}} className="mt-2 block w-full min-h-11 rounded-lg bg-gray-800 px-3"><option value="unsure">Let the team recommend</option><option value="yes">Select raised elements</option><option value="no">Flat print</option></select></div>
    {preference==='yes'&&<fieldset><legend className="text-sm mb-1">Request these elements raised</legend><div className="max-h-40 overflow-auto space-y-1">{snapshot.layers.map((l,i)=><label key={l.id} className="flex gap-2 min-h-11 items-center text-xs"><input type="checkbox" checked={selected.includes(i)} disabled={(!l.maskSvg||identifiedQR(l))&&!selected.includes(i)} onChange={e=>change(preference,e.target.checked?[...selected,i]:selected.filter(n=>n!==i))}/><span>{i+1}. {l.label}{identifiedQR(l)?' — QR stays flat':!l.maskSvg?' — team tracing needed':''}</span></label>)}</div></fieldset>}
    <p className="text-xs text-gray-400">Keep QR codes flat and readable. Named QR layers are excluded from the mask; check QR codes inside uploaded images manually. Saved selections stay with your design.</p>
    <details><summary className="min-h-11 cursor-pointer text-sm text-amber-300">Team review notes</summary><ul className="list-disc pl-4 space-y-2 text-xs text-gray-300"><li>The team can simplify, expand or merge raised areas. This mask does not automatically trace photos or outline fonts.</li>{reviewWarnings(snapshot.layers,width,height).map((w,i)=><li key={i}>{w}</li>)}</ul></details>
    <button disabled={busy||!snapshot.layers.length} onClick={()=>{void onRequest();}} className="w-full min-h-11 px-3 rounded-lg bg-amber-500 text-gray-950 font-semibold disabled:opacity-40">Continue to team proof request</button><p className="text-xs text-gray-400">Saves your design, then opens the quote form. Nothing has been submitted.</p>
    <button disabled={busy||!canAttach||!snapshot.layers.length} onClick={()=>{void onAttach(version);}} className="w-full min-h-11 px-3 rounded-lg border border-amber-400 text-amber-200 disabled:opacity-40">Save & attach this proof to cart</button>
    <p className="text-xs text-gray-400">{canAttach?'Attaches this exact saved version for order review. This is not payment or production approval.':'Add this product to your cart first, then return here to attach your design.'}</p>
    <details><summary className="min-h-11 text-sm cursor-pointer">Download review files</summary><div className="grid gap-2 text-xs"><button className="min-h-11 border border-gray-700 rounded-lg" onClick={()=>download(pairedReviewHTML(input,guides),'paired-review.html','text/html')}>Paired review sheet (.html)</button>{(['print','emboss','overlay'] as ProofView[]).map(v=><button key={v} className="min-h-11 border border-gray-700 rounded-lg" onClick={()=>download(reviewSVG(input,v,guides),v+'-review.svg','image/svg+xml')}>{v==='emboss'?'Emboss Mask':v==='print'?'Print':'Overlay'} (.svg)</button>)}<button className="min-h-11 border border-gray-700 rounded-lg" onClick={()=>download(JSON.stringify(reviewManifest(input,guides),null,2),'review-record.json','application/json')}>Review record (.json)</button><p className="text-gray-400">RGB review files, not PDF spot separations. Print uses a raster preview; text in the mask is not outlined. Team approval is still needed.</p></div></details>
   </div>
  </div>
 </dialog>;
}
