import { isSameOriginAdminMutation } from './admin-review';
export const privateHeaders = { 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff' };
export function validRecoveryOrigin(request:Request) {
  return isSameOriginAdminMutation(request) && (new URL(request.url).protocol==='https:' || process.env.NODE_ENV!=='production');
}
export async function recoveryBody(request:Request):Promise<Record<string,unknown>> {
  const reader=request.body?.getReader(); if(!reader)throw new Error('Invalid body');
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>4096){await reader.cancel();throw new Error('Body too large');}chunks.push(value);}
  const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!parsed || typeof parsed!=='object' || Array.isArray(parsed))throw new Error('Invalid body');
  return parsed;
}
