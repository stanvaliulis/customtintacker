import {createHmac,randomUUID,timingSafeEqual,createHash} from 'node:crypto';
import {StorageError} from '../artwork-storage/service';
export const OWNER_COOKIE='__Host-ctt-artwork';
export const OWNER_SECONDS=30*24*60*60;
export const MAX_REQUEST_BYTES=3_500_000;
function signingKey(secret:string){if(secret.length<32)throw new StorageError('Artwork session signing is not configured.',503);return secret;}
export function createGuestOwner(secret:string,now=Date.now()){
 const ownerId='guest-'+randomUUID(),expires=Math.floor(now/1000)+OWNER_SECONDS;
 const body=Buffer.from(JSON.stringify({v:1,ownerId,expires})).toString('base64url');
 const signature=createHmac('sha256',signingKey(secret)).update('ctt-artwork-session:'+body).digest('base64url');
 return {ownerId,token:body+'.'+signature};
}
export function verifyGuestOwner(token:string|undefined,secret:string,now=Date.now()):string|null{
 signingKey(secret);if(!token||token.length>600)return null;
 const parts=token.split('.');if(parts.length!==2)return null;
 const expected=createHmac('sha256',secret).update('ctt-artwork-session:'+parts[0]).digest();
 let actual:Buffer;try{actual=Buffer.from(parts[1],'base64url');}catch{return null;}
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
 try{const p=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
 if(p.v!==1||!/^guest-[0-9a-f-]{36}$/.test(p.ownerId)||!Number.isSafeInteger(p.expires)||p.expires<=now/1000||p.expires>now/1000+OWNER_SECONDS+60)return null;
 return p.ownerId;}catch{return null;}
}
export function accountOwner(subject:string){if(!subject||subject.length>320)throw new StorageError('Verified account subject missing.',401);return 'account-'+createHash('sha256').update('ctt-account:'+subject).digest('hex');}
export function requireSameOrigin(req:Request){
 const origin=req.headers.get('origin');
 const url=new URL(req.url),host=req.headers.get('host')||url.host;
 if(!origin||origin!==url.protocol+'//'+host||req.headers.get('sec-fetch-site')==='cross-site')throw new StorageError('Same-origin request required.',403);
}
export async function boundedJson(req:Request,max=MAX_REQUEST_BYTES):Promise<unknown>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new StorageError('JSON request required.',415);
 if(Number(req.headers.get('content-length')||0)>max)throw new StorageError('Saved artwork is too large for the server upload limit. Keep your recovery packet.',413);
 if(!req.body)throw new StorageError('Request body required.');const reader=req.body.getReader(),parts:Uint8Array[]=[];let total=0;
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.length;if(total>max){await reader.cancel();throw new StorageError('Saved artwork is too large for the server upload limit. Keep your recovery packet.',413);}parts.push(chunk.value);}}finally{reader.releaseLock();}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));}catch{throw new StorageError('Invalid JSON request.');}
}
