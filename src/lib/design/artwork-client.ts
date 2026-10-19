let session:Promise<void>|null=null;
/** Establish ownership before any artwork write, including concurrent saves in one tab. */
export async function artworkFetch(url:string,options?:RequestInit){
 if(url==='/api/artwork/save'){
  if(typeof options?.body!=='string'||new TextEncoder().encode(options.body).byteLength>3_500_000)throw Error('Online saves are limited to 3.5 MB including embedded artwork and metadata. Keep your recovery packet for larger artwork.');
  if(!session)session=(async()=>{const r=await fetch('/api/artwork/session',{method:'POST',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Private artwork saving is unavailable. Keep your recovery packet.');})().catch(e=>{session=null;throw e;});
  await session;
 }
 const result=await fetch(url,options);if(result.status===401)session=null;return result;
}
