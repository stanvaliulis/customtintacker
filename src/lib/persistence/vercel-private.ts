import {createHash} from 'node:crypto';
import * as blob from '@vercel/blob';
import {StorageError,type BlobStore,type StoredObject} from '../artwork-storage/service';
const MAX=15*1024*1024;
const validKey=(key:string)=>{if(!/^artwork\/[a-f0-9]{64}\/[a-f0-9]{64}\/[a-f0-9]{64}$/.test(key))throw new StorageError('Invalid private object key.');};
/** Explicit server-only credential injection. Never reads environment or returns provider URLs. */
export function vercelPrivateBlobs(token:string,sdk:Pick<typeof blob,'get'|'put'>=blob):BlobStore {
 if(!token)throw new StorageError('Private blob credential unavailable.',503);
 async function readObject(key:string){
  validKey(key);
  const result=await sdk.get(key,{access:'private',useCache:false,token,headers:{'accept-encoding':'identity'},abortSignal:AbortSignal.timeout(15000)});
  if(!result||result.statusCode!==200||result.blob.pathname!==key||result.blob.size>MAX)throw new StorageError('Private object unavailable or oversized.',503);
  const reader=result.stream.getReader(),parts:Uint8Array[]=[];let size=0;
  try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>MAX){await reader.cancel();throw new StorageError('Private object exceeds limit.',503);}parts.push(next.value);}}finally{reader.releaseLock();}
  // Fetch decodes compressed bodies; SDK size comes from wire Content-Length (or zero when absent).
  // Compare transport length only when it describes decoded bytes. Every persisted object is also hash/size verified.
  const encoding=result.headers?.get('content-encoding'),length=result.headers?.get('content-length');
  if((!encoding||encoding==='identity')&&(!result.headers||length!==null)&&size!==result.blob.size)throw new StorageError('Private object truncated.',503);
  return {bytes:Buffer.concat(parts),mime:result.blob.contentType};
 }
 async function verify(object:StoredObject){const read=await readObject(object.key);if(read.bytes.length!==object.bytes||read.mime!==object.mime||createHash('sha256').update(read.bytes).digest('hex')!==object.sha256)throw new StorageError('Immutable object conflict.',409);}
 return {read:async key=>(await readObject(key)).bytes,putIfAbsent:async(object,bytes)=>{
  validKey(object.key);if(bytes.length>MAX||bytes.length!==object.bytes||createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw new StorageError('Object bytes mismatch.');
  try{await sdk.put(object.key,Buffer.from(bytes),{token,access:'private',allowOverwrite:false,addRandomSuffix:false,contentType:object.mime,abortSignal:AbortSignal.timeout(15000)});}catch{
   // Includes existing-object and response-lost cases. Only verified identical private content counts as success.
   try{await verify(object);return;}catch{throw new StorageError('Private upload unconfirmed; retry the same request.',503);}
  }
  await verify(object);
 }};
}
