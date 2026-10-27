'use client';
import {useEffect,useRef,useState} from 'react';
type Item={productId:string;quantity:number;backing?:string};
type Result={status:string;payable?:boolean;reason?:string;expiresAt?:string;notice?:string;rates?:{service:string;carrier:string;cents:number;currency:string}[];quoteId?:string};
export default function ShippingEstimate({items}:{items:Item[]}){
 const [zip,setZip]=useState(''),[street,setStreet]=useState(''),[city,setCity]=useState(''),[state,setState]=useState(''),[kind,setKind]=useState('');
 const [result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const binding=JSON.stringify({items,zip,street,city,state,kind}),latest=useRef(binding),sequence=useRef(0);latest.current=binding;
 useEffect(()=>{sequence.current++;setResult(null);setError('');setBusy(false);},[binding]);
 useEffect(()=>{if(!result?.expiresAt)return;const ms=Date.parse(result.expiresAt)-Date.now();if(ms<=0){setResult(null);return;}const t=setTimeout(()=>{setResult(null);setError('Estimate expired. Request a fresh estimate.');},ms);return()=>clearTimeout(t);},[result]);
 async function calculate(){const requested=latest.current,id=++sequence.current;setBusy(true);setResult(null);setError('');try{
  const response=await fetch('/api/shipping/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,destination:{streetLines:[street],city,state,postalCode:zip,country:'US',residential:kind==='residential'}})}),body=await response.json();
  if(latest.current!==requested||id!==sequence.current)return;
  if(!response.ok)throw Error('Shipping review required. Please check the address or contact our team.');
  if(body.status==='account-rate-estimate'&&(body.payable!==false||!body.quoteId||!Array.isArray(body.rates)||!body.rates.length||body.rates.some((r:{cents:number;currency:string})=>!Number.isSafeInteger(r.cents)||r.cents<=0||r.currency!=='USD')||!Number.isFinite(Date.parse(body.expiresAt))||Date.parse(body.expiresAt)<=Date.now()))throw Error('Shipping review required.');
  setResult(body);
 }catch{if(latest.current===requested&&id===sequence.current)setError('Shipping review required. Please check the address or contact our team.');}finally{if(latest.current===requested&&id===sequence.current)setBusy(false);}}
 return <section className="mt-6 border-t pt-4" aria-label="Nonbinding shipping estimate"><h3 className="font-semibold">Shipping planning estimate</h3>
 <p className="text-xs text-gray-600 mt-2">Packing is estimated, not measured. Not added to your order total. Staff confirms shipping before payment.</p>
 <label htmlFor="estimate-address">Street address</label><input id="estimate-address" value={street} maxLength={100} onChange={e=>setStreet(e.target.value)} className="w-full border rounded p-2" />
 <label htmlFor="estimate-city">City</label><input id="estimate-city" value={city} maxLength={100} onChange={e=>setCity(e.target.value)} className="w-full border rounded p-2" />
 <label htmlFor="estimate-state">State (two letters)</label><input id="estimate-state" value={state} maxLength={2} onChange={e=>setState(e.target.value.toUpperCase())} className="w-full border rounded p-2" />
 <label htmlFor="estimate-zip">US destination ZIP</label><input id="estimate-zip" value={zip} maxLength={10} onChange={e=>setZip(e.target.value)} className="w-full border rounded p-2" />
 <label htmlFor="estimate-kind">Address type</label><select id="estimate-kind" value={kind} onChange={e=>setKind(e.target.value)} className="w-full border rounded p-2"><option value="">Choose address type</option><option value="business">Business</option><option value="residential">Residential</option></select>
 <button type="button" disabled={busy||!kind||!street.trim()||!city.trim()||state.length!==2||!/^\d{5}(-\d{4})?$/.test(zip)} onClick={calculate} className="mt-3 text-sm font-medium text-amber-700">{busy?'Estimating…':'Estimate shipping'}</button>
 <div aria-live="polite">{error&&<p>{error}</p>}{result&&result.status!=='account-rate-estimate'&&<p>Shipping review required: {result.reason||'Contact our team for confirmed shipping.'}</p>}{result?.status==='account-rate-estimate'&&<div>{result.rates?.map((r,i)=><p key={i}>{r.carrier.toUpperCase()} {r.service}: estimated {new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(r.cents/100)}</p>)}<p>{result.notice}</p><p>Estimate expires {result.expiresAt}. Not a payable quote.</p></div>}</div></section>;
}
