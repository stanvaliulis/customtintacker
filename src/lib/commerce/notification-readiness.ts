import {livePaymentConfig} from './live-payment-config';

type Counts={pending:number;sending:number;held:number;delivered:number;other:number};
type QueueSummary={invoice:Counts;paid:Counts};
function count(value:unknown){
 if(typeof value!=='number'&&(typeof value!=='string'||!/^\d+$/.test(value)))throw Error('Invalid aggregate.');
 const number=Number(value);
 if(!Number.isSafeInteger(number)||number<0)throw Error('Invalid aggregate.');
 return number;
}
function queueSummary(value:unknown):QueueSummary{
 if(!Array.isArray(value)||value.length!==2)throw Error('Invalid aggregates.');
 const result:Partial<QueueSummary>={};
 for(const raw of value){
  if(!raw||typeof raw!=='object')throw Error('Invalid aggregate.');
  const row=raw as Record<string,unknown>,kind=row.kind;
  if((kind!=='invoice'&&kind!=='paid')||result[kind])throw Error('Invalid queue.');
  const total=count(row.total),pending=count(row.pending),sending=count(row.sending),held=count(row.held),delivered=count(row.delivered);
  const known=pending+sending+held+delivered;
  if(!Number.isSafeInteger(known)||known>total)throw Error('Invalid aggregate.');
  result[kind]={pending,sending,held,delivered,other:total-known};
 }
 if(!result.invoice||!result.paid)throw Error('Missing queue.');
 return {invoice:result.invoice,paid:result.paid};
}
/** Admin-only observation. No provider calls, sends, leases, configuration changes, or customer rows. */
export function notificationReadinessHandler(deps:{
 authenticate:()=>Promise<boolean>;
 env:()=>Record<string,string|undefined>;
 schema:()=>Promise<boolean>;
 queues:()=>Promise<unknown>;
}){
 return async(req:Request)=>{
  const headers={'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Cookie'};
  const reply=(body:object,status:number)=>Response.json(body,{status,headers});
  try{
   if(!await deps.authenticate())return reply({error:'Administrator sign-in required.'},401);
   if(req.method!=='GET')return reply({error:'Read-only diagnostic required.'},405);
   if(new URL(req.url).search)return reply({error:'Diagnostic parameters are not accepted.'},400);
   const env=deps.env();
   if(env.TIN_CHECKOUT_PAUSED!=='1'||['TIN_INVOICE_MAIL_ENABLED','TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED','TIN_PAID_ORDER_MAIL_ENABLED'].some(key=>env[key]!=='0'))
    return reply({error:'Paused checkout and disabled mail required.'},409);
   try{livePaymentConfig(env);}catch{return reply({error:'Production configuration unverified.'},503);}
   if(!await deps.schema())return reply({error:'Production notification schemas unverified.'},503);
   const queues=queueSummary(await deps.queues());
   const senderConfigured=!!env.RESEND_FROM&&!/[\r\n]/.test(env.RESEND_FROM)&&env.RESEND_FROM.includes('@');
   const senderMatchesExpected=env.RESEND_FROM?.trim()==='Custom Tin Tackers <notifications@customtintackers.com>';
   const providerCredentialConfigured=!!env.RESEND_API_KEY;
   const workerCredentialConfigured=!!env.CRON_SECRET&&env.CRON_SECRET.length>=32;
   const configuredRecipientMatches=env.NOTIFICATION_EMAIL==='sales@customtintackers.com';
   const workflowEnabled=env.TIN_WORKFLOW_ENABLED==='1';
   return reply({
    schemaValid:true,checkoutPaused:true,orderMailDisabled:true,workflowEnabled,
    senderConfigured,senderMatchesExpected,providerCredentialConfigured,workerCredentialConfigured,configuredRecipientMatches,
    configurationChecksPass:workflowEnabled&&senderConfigured&&senderMatchesExpected&&providerCredentialConfigured&&workerCredentialConfigured&&configuredRecipientMatches,
    queues,
    queueReviewRequired:Object.values(queues).some(queue=>queue.pending+queue.sending+queue.held+queue.other>0),
    deliveryVerified:false,sendAttempted:false,activationPerformed:false,
   },200);
  }catch{return reply({error:'Read-only notification verification unavailable.'},503);}
 };
}
