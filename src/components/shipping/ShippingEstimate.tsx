'use client';
import {useEffect,useRef,useState} from 'react';
type Item={productId:string;quantity:number};
type Result={status:'estimate'|'shipping-review-required';reason?:string;postageCents?:number;expiresAt?:string;uncertainty?:string;parcels?:unknown[];error?:string};
export default function ShippingEstimate({items}:{items:Item[]}){
 const [zip,setZip]=useState(''),[address,setAddress]=useState(''),[result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const cartKey=JSON.stringify(items),binding=cartKey+'|'+zip+'|'+address,latest=useRef(binding);latest.current=binding;
 useEffect(()=>{setResult(null);setError('');setBusy(false);},[binding]);
 useEffect(()=>{if(!result?.expiresAt)return;const ms=Date.parse(result.expiresAt)-Date.now();if(ms<=0){setResult(null);return;}const t=setTimeout(()=>setResult(null),ms);return()=>clearTimeout(t);},[result]);
 async function calculate(){const requested=latest.current;setBusy(true);setError('');setResult(null);try{const response=await fetch('/api/shipping/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,destination:{country:'US',postalCode:zip,address}})}),body=await response.json();if(latest.current!==requested)return;if(!response.ok)throw new Error(body.error||'Shipping review required.');if(body.status==='estimate'&&(!Number.isSafeInteger(body.postageCents)||body.postageCents<=0||!Number.isFinite(Date.parse(body.expiresAt))))throw new Error('Shipping review required.');setResult(body);}catch(e){if(latest.current===requested)setError(e instanceof Error?e.message:'Shipping review required.');}finally{if(latest.current===requested)setBusy(false);}}
 return <section className="mt-6 border-t pt-4" aria-label="Nonbinding shipping estimate">
 <h3 className="font-semibold">Shipping planning estimate</h3>
 <p className="text-xs text-gray-600 mt-2">Research estimate only. Guessed packing, commercial-postage eligibility unconfirmed. Not added to your order total. Staff confirms shipping before payment.</p>
 <label htmlFor="estimate-zip" className="block text-sm mt-3">US destination ZIP</label><input id="estimate-zip" inputMode="numeric" maxLength={5} value={zip} onChange={e=>setZip(e.target.value)} className="w-full border rounded p-2" />
 <label htmlFor="estimate-address" className="block text-sm mt-3">Address context (optional)</label><input id="estimate-address" maxLength={300} value={address} onChange={e=>setAddress(e.target.value)} className="w-full border rounded p-2" />
 <p className="text-xs text-gray-500 mt-1">Only benchmark ZIPs 60601, 10001 and 90012 are covered. Address context is not validated or stored.</p>
 <button type="button" disabled={busy} onClick={calculate} className="mt-3 text-sm font-medium text-amber-700">{busy?'Estimating…':'Estimate postage'}</button>
 <div aria-live="polite">{error&&<p className="text-sm mt-2">{error}</p>}{result?.status==='shipping-review-required'&&<p className="text-sm mt-2">Shipping review required: {result.reason}</p>}{result?.status==='estimate'&&<div className="text-sm mt-2"><p>Estimated commercial postage: {new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(result.postageCents!/100)} for {result.parcels?.length} estimated parcels.</p><p className="text-xs mt-2">{result.uncertainty}</p><p className="text-xs mt-2">Research tariff checked October 26, 2026; review deadline October 27, 2026, 13:00 UTC. Estimate expires {result.expiresAt}.</p></div>}</div>
 </section>;
}
