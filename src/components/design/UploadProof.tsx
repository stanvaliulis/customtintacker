'use client';
import {artworkFetch} from '@/lib/design/artwork-client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {useOptionalCart} from '@/context/CartContext';
import {guidedCanvas,type GuidedReview} from '@/lib/design/guided-review';
import {canonical,savedAttachment,sourceVersion,type ProofAttachment} from '@/lib/design/proof-attachment';
import {MAX_DESIGN_BYTES} from '@/lib/design/document';
import Link from 'next/link';
import type {Product} from '@/types/product';
import {fitArtwork} from '@/lib/design/upload-proof';
import {prepareArtwork,reopenPacket,MAX_ART_BYTES,MAX_PACKET_BYTES,type Artwork} from '@/lib/design/upload-files';
const sample='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect id="background" width="600" height="400" fill="#102a43"/><circle id="brand-badge" cx="300" cy="200" r="125" fill="#fbbf24"/><path id="logo-mountain" d="M210 235 L280 130 L320 190 L350 155 L400 235 Z" fill="#102a43"/><rect id="qr-code" x="530" y="330" width="40" height="40" fill="white"/></svg>';
const data=(s:string)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
const parse=(s:string)=>new DOMParser().parseFromString(s,'image/svg+xml');
const decode=(url:string)=>new Promise<{width:number;height:number}>((resolve,reject)=>{const img=new Image();const timeout=setTimeout(()=>{img.src='';reject(Error('Image decoding timed out. Your previous review is unchanged.'));},15000);img.onload=()=>{clearTimeout(timeout);resolve({width:img.naturalWidth,height:img.naturalHeight});};img.onerror=()=>{clearTimeout(timeout);reject(Error('This image could not be decoded.'));};img.src=url;});
export default function UploadProof({products,initialProductId}:{products:Product[];initialProductId?:string}){
 const cart=useOptionalCart();
 const saved=useRef<{key:string;id:string;attachment:ProofAttachment}|null>(null);
 const alive=useRef(true);
 const [productId,setProductId]=useState(products.find(p=>p.id===initialProductId)?.id||products.find(p=>p.id==='18-inch-square-tacker')?.id||products[0].id);
 const [art,setArt]=useState<Artwork|null>(null),[selected,setSelected]=useState<string[]>([]),[choice,setChoice]=useState('suggested'),[view,setView]=useState('overlay'),[notes,setNotes]=useState(''),[decision,setDecision]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const generation=useRef(0);
 const product=products.find(p=>p.id===productId)!;const supported=['square','rectangle','circle','oval'].includes(product.shape);
 const w=product.dimensions.width*72,h=product.dimensions.height*72;
 const fit=art&&supported?fitArtwork(art.width,art.height,w,h,['circle','oval'].includes(product.shape)):null;
 const [notice,setNotice]=useState('');
 const packet=useMemo<GuidedReview|null>(()=>art?{version:1,product:{id:product.id,shape:product.shape,width:product.dimensions.width,height:product.dimensions.height},original:{name:art.name,data:art.original},embossPreference:choice,selectedRegions:selected,customerDecision:decision,notes,productionApproval:'unapproved',delivery:'local-only-not-submitted'}:null,[art,product.id,product.shape,product.dimensions.width,product.dimensions.height,choice,selected,decision,notes]);
 const current=useRef<GuidedReview|null>(packet);current.current=packet;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get('review');if(!id)return;
  if(!/^design-[A-Za-z0-9_-]+$/.test(id)){setError('Invalid saved review ID.');return;}
  const ticket=++generation.current;setBusy(true);
  void (async()=>{try{
   const response=await artworkFetch(`/api/artwork/load/${encodeURIComponent(id)}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Saved review unavailable. Reopen your recovery packet.');
   const record=await response.json();if(record.id!==id)throw Error('Saved review ID mismatch.');
   await savedAttachment(record,product.id);
   const p=JSON.parse(record.canvasJson).guidedUpload;if(!p)throw Error('This is a DIY design. Use its original editor.');
   const reopened=await reopenPacket(JSON.stringify(p),products,parse,decode);
   if(!alive.current||ticket!==generation.current)return;
   setProductId(reopened.productId);setArt(reopened.art);setSelected(reopened.selected);setChoice(reopened.choice);setNotes(reopened.notes);setDecision('');setNotice('Saved review reopened and artwork revalidated. Confirm your direction again before attaching.');
  }catch(e){if(alive.current&&ticket===generation.current)setError(e instanceof Error?e.message:'Could not reopen review.');}finally{if(alive.current&&ticket===generation.current)setBusy(false);}})();
 // Initial URL is a recovery request; later product changes must not reload it over edits.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function saveToCart(){
  if(!packet||!cart||busy)return;
  const key=canonical(packet),ticket=++generation.current;setBusy(true);setError('');setNotice('');
  const active=()=>alive.current&&ticket===generation.current&&current.current===packet;
  try{
   // Rebuild from original bytes, never the displayed SVG or imported approval.
   await reopenPacket(JSON.stringify(packet),products,parse,decode);
   const canvas=guidedCanvas(packet),canvasJson=JSON.stringify(canvas);
   if(canvasJson.length>MAX_DESIGN_BYTES)throw Error('This review exceeds the existing 8 MiB saved-design limit. Keep your recovery packet; the original remains here.');
   const source={productId:product.id,shape:product.shape,width:product.dimensions.width,height:product.dimensions.height,canvas};
   let id=saved.current?.key===key?saved.current.id:undefined;
   if(!id){
    const response=await artworkFetch('/api/artwork/save',{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'},body:JSON.stringify({...source,canvas:undefined,canvasJson,sessionId:'guided-'+crypto.randomUUID()})});
    const result=await response.json();if(!response.ok||!/^design-[A-Za-z0-9_-]+$/.test(result.id))throw Error(result.error||'Private save failed. Keep your recovery packet and retry.');id=result.id;
   }
   const response=await artworkFetch(`/api/artwork/load/${encodeURIComponent(id!)}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Could not verify saved artwork. Nothing was attached; retry.');
   const record=await response.json();if(record.id!==id)throw Error('Saved review ID mismatch.');
   const attachment=await savedAttachment(record,product.id,sourceVersion(source));
   const expected=await savedAttachment({...source,id:id!,canvasJson},product.id);
   if(attachment.sourceHash!==expected.sourceHash)throw Error('Saved artwork changed or was replaced. Reopen and review it again.');
   if(!active())return;
   saved.current={key,id:id!,attachment};cart.attachGuided(product,attachment);
   setNotice('Saved review attached to your local cart. Repeating this action does not increase quantity. Production approval is still pending.');
  }catch(e){if(active())setError(e instanceof Error?e.message:'Could not attach review. Your original remains here.');}finally{if(alive.current&&ticket===generation.current)setBusy(false);}
 }
 function reset(){setDecision('');setNotice('');}
 async function load(file:File,packet=false){const ticket=++generation.current;setBusy(true);setError('');setNotice('');try{
  if(!file.size||file.size>(packet?MAX_PACKET_BYTES:MAX_ART_BYTES))throw Error(packet?'Choose a nonempty review packet up to 22 MiB.':'Choose nonempty artwork up to 15 MiB.');
  if(packet){const reopened=await reopenPacket(await file.text(),products,parse,decode);if(ticket!==generation.current)return;setProductId(reopened.productId);setArt(reopened.art);setSelected(reopened.selected);setChoice(reopened.choice);setNotes(reopened.notes);setDecision('');setNotice('Review packet reopened. Artwork was revalidated; please confirm your direction again.');}
  else{const result=await prepareArtwork(file.name,new Uint8Array(await file.arrayBuffer()),parse,decode);if(ticket!==generation.current)return;setArt(result);setSelected(result.suggestions.map(s=>s.id));setChoice(result.suggestions.length?'suggested':'team');setDecision('');setNotice('Artwork ready. Existing notes are retained.');}
 }catch(e){if(ticket===generation.current)setError((e instanceof Error?e.message:'Could not load file')+' Your previous artwork, notes and review are unchanged.');}finally{if(ticket===generation.current)setBusy(false);}}
 const mask=art?.viewBox?data(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${art.viewBox}">${choice==='suggested'?art.suggestions.filter(s=>selected.includes(s.id)).map(s=>s.markup).join(''):''}</svg>`):null;
 function download(){if(!art)return;try{const bundle={version:1,product:{id:product.id,shape:product.shape,width:product.dimensions.width,height:product.dimensions.height},original:{name:art.name,data:art.original},fit,embossPreference:choice,selectedRegions:selected,customerDecision:decision,notes,productionApproval:'unapproved',delivery:'local-only-not-submitted'};const u=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='upload-proof-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);setNotice('Download requested. Check your Downloads folder before leaving; reopen this packet to recover your review.');}catch{setError('Download could not start. Your review remains here; please retry before leaving.');}}
 const button='min-h-11 rounded-lg px-4 py-3 border border-slate-300 font-medium disabled:opacity-40';
 return <div className="bg-slate-50 text-slate-900 min-h-screen"><div className="max-w-6xl mx-auto px-5 py-10">
 <div className="flex justify-between gap-4 items-start"><Link href="/design" className="underline text-sm">← All design options</Link><span className="text-xs uppercase tracking-widest text-teal-800">Upload & emboss · local review</span></div>
 <h1 className="text-4xl sm:text-5xl font-bold mt-8">Upload & emboss</h1><p className="text-lg text-slate-600 mt-4 max-w-2xl">Have finished artwork? We’ll fit it to your sign and suggest raised areas when the file supports it. Review the result or ask the team to prepare your proof.</p>
 <ol aria-label="Upload progress" className="grid sm:grid-cols-3 gap-3 my-8 text-sm"><li aria-current={!art?'step':undefined} className="rounded-xl border bg-white p-4"><strong>1 · Choose & upload</strong><p className="mt-1 text-slate-600">{art?'Original artwork kept unchanged.':'Choose your product and finished artwork.'}</p></li><li aria-current={art&&!decision?'step':undefined} className="rounded-xl border bg-white p-4"><strong>2 · Review your proof</strong><p className="mt-1 text-slate-600">{art?(art.preview&&supported?'Fit ready. Check the print and raised overlay.':'Team preparation is the next step for this artwork.'):"We’ll fit supported artwork automatically."}</p></li><li aria-current={decision?'step':undefined} className="rounded-xl border bg-white p-4"><strong>3 · Confirm your direction</strong><p className="mt-1 text-slate-600">{decision?'Direction recorded locally. Keep your review packet.':'Looks right, or tell us what to change.'}</p></li></ol>
 <div className="grid grid-cols-1 lg:grid-cols-[350px_minmax(0,1fr)] gap-6"><section className="min-w-0 bg-white rounded-2xl border p-6 space-y-5"><h2 className="text-xl font-bold">Start with your finished artwork</h2>
 <label className="block font-medium">Your product<select className="block min-w-0 max-w-full border rounded-lg p-3 w-full mt-2" value={productId} disabled={busy} onChange={e=>{setProductId(e.target.value);reset();}}>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.dimensions.displaySize}</option>)}</select></label>
 <label className="block border-2 border-dashed rounded-xl p-5">Choose artwork<input className="block w-full min-w-0 text-sm mt-3 max-w-full" type="file" accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.ai" onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void load(file);}}/></label><p className="text-sm text-slate-600">Up to 15 MiB. Simple SVG: automatic fit + supported raised-area suggestions. PNG/JPG/WebP: automatic fit; the team advises on embossing. PDF/AI: team preparation. Nothing is submitted.</p>
 <button className={button+' w-full'} onClick={()=>void load(new File([sample],'sample-brand.svg',{type:'image/svg+xml'}))}>Try sample artwork</button>
 <div role="status">{busy?'Checking your file; your current review is retained…':error||notice||art?.name}</div>
 <div className="rounded-xl bg-slate-50 p-4 space-y-3"><h3 className="font-bold">Keep your review</h3><p className="text-sm text-slate-600">No automatic saving. Save and attach a confirmed review to the local cart, or download a packet before leaving. Reopen saved reviews from the cart. It includes your original artwork and notes. Approval always needs reconfirmation.</p><button className={button+' w-full'} disabled={!art||busy} onClick={download}>Download review packet</button><label className="block text-sm font-medium">Reopen review packet (JSON, up to 22 MiB)<input className="block w-full min-w-0 mt-2 max-w-full" type="file" accept=".json,application/json" aria-label="Reopen review packet" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void load(file,true);}}/></label><p className="text-xs text-slate-500">Raster headers are checked before decoding: up to 40 million pixels, 32,768 per side. This is a dimension check, not a guarantee of browser memory use.</p></div><div className="border-t pt-5"><h3 className="font-bold">Design your own instead?</h3><p className="text-sm text-slate-600 my-2">Start from a template or make your own layout. The full editor is optional.</p><Link className="underline text-teal-800" href={`/design/${product.id}`}>Open DIY designer →</Link></div></section>
 <section className="min-w-0 bg-white rounded-2xl border p-6"><div className="flex flex-wrap gap-3 justify-between"><h2 className="text-xl font-bold">Review your proof</h2><span className="text-sm text-slate-500">{product.dimensions.displaySize} · {product.shape}</span></div>
 {art?.preview&&fit?<><div className="flex flex-wrap gap-2 mt-5" aria-label="Proof view">{['print','overlay','emboss'].map(v=><button key={v} className={button+(view===v?' bg-teal-900 text-white':'')} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='print'?'Print':v==='overlay'?'Raised overlay':'Raised areas'}</button>)}</div><div className="bg-slate-100 rounded-xl p-6 mt-4"><svg role="img" aria-label="Fitted artwork review" viewBox={`0 0 ${w} ${h}`} className="w-full max-h-[430px]" style={{aspectRatio:`${w}/${h}`}}>{['circle','oval'].includes(product.shape)?<ellipse cx={w/2} cy={h/2} rx={w/2} ry={h/2} fill="white" stroke="#94a3b8" strokeWidth="3"/>:<rect width={w} height={h} fill="white" stroke="#94a3b8" strokeWidth="3"/>}{view!=='emboss'&&<image href={art.preview} {...fit}/>} {view!=='print'&&mask&&<image href={mask} {...fit} opacity={view==='overlay'?0.65:1}/>}</svg></div><p className="text-sm mt-3 text-slate-600">Artwork is centered and fitted without cropping. Green shows proposed raised areas. Preview shape is approximate; the team confirms the final cut and proof.</p>{!art.viewBox&&<p className="text-sm mt-2">Placed image resolution: about {Math.floor(art.width/(fit.width/72))} PPI. Team review confirms print quality.</p>}</>:<div className="rounded-xl bg-slate-100 min-h-72 mt-6 flex items-center justify-center p-8 text-center text-slate-500">{art?(supported?'Team preparation needed for this file.':'This product’s custom shape needs a team-prepared fit. Your original is preserved.'):'Your fitted artwork and proof suggestions will appear here.'}</div>}
 {art&&<div className="mt-6 space-y-4">{art.fallback&&<p className="rounded-lg bg-amber-50 p-4 text-sm">{art.fallback}</p>}<fieldset><legend className="font-bold mb-3">How should it feel?</legend><div className="flex flex-wrap gap-2">{[['suggested','Use suggested raised areas'],['flat','Keep it flat'],['team','Let the team advise']].map(([v,l])=><button key={v} disabled={busy||(v==='suggested'&&(!supported||!art.suggestions.length))} className={button+(choice===v?' bg-teal-900 text-white':'')} aria-pressed={choice===v} onClick={()=>{setChoice(v);reset();}}>{l}</button>)}</div></fieldset>
 {choice==='suggested'&&<div className="space-y-3"><p className="rounded-lg bg-teal-50 p-3 text-sm" role="status">{selected.length} suggested raised {selected.length===1?'area':'areas'} selected. You can use these as a starting point; the team confirms feasibility.</p><details className="rounded-lg border p-3"><summary className="cursor-pointer font-medium min-h-11 flex items-center">Adjust suggested areas (optional)</summary><div className="space-y-3 pt-3"><button className={button} disabled={busy} onClick={()=>{setSelected(art.suggestions.map(s=>s.id));reset();}}>Restore suggested areas</button>{art.suggestions.map(s=><label className="flex items-center gap-3" key={s.id}><input type="checkbox" disabled={busy} checked={selected.includes(s.id)} onChange={e=>{setSelected(old=>e.target.checked?[...old,s.id]:old.filter(id=>id!==s.id));reset();}}/>{s.label}</label>)}<p className="text-sm text-slate-500">Suggested from existing vector shapes, not automatic tracing. {art.excluded>0?`${art.excluded} identified QR/barcode region excluded.`:'Unlabelled QR codes may not be recognized; check the preview.'}</p></div></details></div>}
 <h3 className="text-lg font-bold pt-3">Confirm your direction</h3><p className="text-sm text-slate-600">Keep it simple: use the suggestions, choose flat, or let the team advise. Production approval comes after the team’s final proof.</p><label className="block font-medium">Anything to change?<textarea className="block border rounded-lg p-3 mt-2 w-full" maxLength={2000} disabled={busy} value={notes} onChange={e=>{setNotes(e.target.value);setDecision('');}} placeholder="Tell the team what you want raised or adjusted."/></label>
 <div className="flex flex-wrap gap-3"><button disabled={busy||!art.preview||!supported||(choice==='suggested'&&!selected.length)} className={button+' bg-teal-900 text-white'} onClick={()=>setDecision('direction-approved')}>Approve this direction</button><button className={button} disabled={busy} onClick={()=>setDecision('team-proof-requested')}>Request team proof / changes</button></div>
 {cart&&<div className="rounded-xl border p-4 space-y-3"><button className={button+' w-full'} disabled={busy||!decision} onClick={()=>void saveToCart()}>Save review and attach to cart</button><p className="text-sm">A new cart line uses the product minimum of {product.minimumOrder}; an existing line keeps its quantity and options. Online saves are limited to 3.5 MB including embedded artwork and metadata. Larger artwork stays in your recovery packet. Guest reviews require the original browser session; keep a recovery packet for other devices. Original bytes and notes are retained; no order or team request is sent.</p><Link className="underline" href="/cart">Review local cart</Link></div>}
 {decision&&<div role="status" className="rounded-xl bg-teal-50 p-4"><strong>{decision==='direction-approved'?'Direction recorded locally.':'Team-proof request prepared locally.'}</strong><p className="text-sm my-2">This is not production approval and has not been sent. Download the review packet with your unchanged original and notes. Before leaving, download the packet above; reopen it to recover your artwork and notes.</p></div>}</div>}
 </section></div></div></div>;
}
