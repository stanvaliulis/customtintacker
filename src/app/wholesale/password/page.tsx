'use client';
import {useState} from 'react';
export default function RequestPassword(){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 return <section className="max-w-md mx-auto px-5 py-16"><h1 className="text-3xl font-bold mb-4">Set or reset your password</h1><p className="mb-6">Enter the email used for your distributor account. If it is eligible, we’ll email a secure link.</p>
 <form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const r=await fetch('/api/distributor-password/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const data=await r.json();setMessage(data.message||'Unable to submit. Please try again later.');}catch{setMessage('Unable to submit. Please try again later.');}finally{setBusy(false);}}}>
 <label className="block" htmlFor="recovery-email">Email address</label><input className="w-full border rounded p-3" id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/>
 <button className="w-full bg-amber-700 text-white rounded p-3 disabled:opacity-50" disabled={busy}>{busy?'Submitting…':'Email me a secure link'}</button><p role="status" aria-live="polite">{message}</p></form><a className="block mt-6 underline" href="/wholesale/login">Back to sign in</a></section>;
}
