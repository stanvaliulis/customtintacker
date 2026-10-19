/** Edge-compatible signed admin session. Existing AUTH_SECRET; never a fixed cookie marker. */
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function key(secret:string){if(secret.length<32)throw Error('Admin session signing is not configured.');return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function createAdminToken(secret:string,now=Date.now()){
 const body=`v1.${Math.floor(now/1000)+86400}.${crypto.randomUUID()}`;
 return body+'.'+hex(await crypto.subtle.sign('HMAC',await key(secret),encoder.encode('ctt-admin:'+body)));
}
export async function verifyAdminToken(token:string|undefined,secret:string,now=Date.now()):Promise<boolean>{
 if(!token||token.length>200||secret.length<32)return false;
 const parts=token.split('.');if(parts.length!==4||parts[0]!=='v1'||!/^\d+$/.test(parts[1])||!/^[-a-f0-9]{36}$/.test(parts[2])||!/^[a-f0-9]{64}$/.test(parts[3]))return false;
 const expires=Number(parts[1]);if(!Number.isSafeInteger(expires)||expires<=now/1000||expires>now/1000+86460)return false;
 try{return await crypto.subtle.verify('HMAC',await key(secret),Uint8Array.from(parts[3].match(/../g)!,h=>parseInt(h,16)),encoder.encode('ctt-admin:'+parts.slice(0,3).join('.')));}catch{return false;}
}
