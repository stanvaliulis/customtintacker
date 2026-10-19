import type {NotificationTransport} from '../commerce/notifications';
/** Existing Resend account only. Explicit injection keeps local QA disconnected.
 * Resend retains keys24h; use23h to leave clock/queue margin before reconciliation hold.
 * https://resend.com/docs/dashboard/emails/idempotency-keys */
export function resendInvoiceTransport(apiKey:string,from:string,send:typeof fetch=fetch):NotificationTransport {
 if(!apiKey||!from||/[\r\n]/.test(from)||!from.includes('@'))throw Error('Verified Resend sender and credential required.');
 return {retentionMs:23*60*60*1000,send:async(message,key)=>{
  if(message.to.length!==1||message.to[0]!=='sales@customtintackers.com')throw Error('Invoice notification recipient mismatch.');
  if(!/^[A-Za-z0-9:_/-]{1,256}$/.test(key))throw Error('Invalid notification idempotency key.');
  const result=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from,to:message.to,subject:message.subject,text:message.text,html:message.html}),signal:AbortSignal.timeout(15000)});
  if(!result.ok)throw Error('Resend delivery unconfirmed; reconcile or retry same key.');
  const receipt=await result.json();if(!receipt||typeof receipt.id!=='string'||!receipt.id)throw Error('Resend delivery receipt missing.');
  return {accepted:true,messageId:receipt.id};
 }};
}
