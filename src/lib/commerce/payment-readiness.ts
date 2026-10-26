import {livePaymentConfig} from './live-payment-config';
type AccountSummary={id:string;charges_enabled?:boolean;details_submitted?:boolean};
export function paymentReadinessHandler(deps:{
 authenticate:()=>Promise<boolean>;
 env:()=>Record<string,string|undefined>;
 schema:()=>Promise<boolean>;
 account:(key:string)=>Promise<AccountSummary>;
}){
 return async(req:Request)=>{
  const headers={'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Cookie'};
  const reply=(body:object,status:number)=>Response.json(body,{status,headers});
  try{
   if(!await deps.authenticate())return reply({error:'Administrator sign-in required.'},401);
   if(new URL(req.url).search)return reply({error:'Diagnostic parameters are not accepted.'},400);
   const env=deps.env();
   if(env.TIN_CHECKOUT_PAUSED!=='1'||['TIN_INVOICE_MAIL_ENABLED','TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED','TIN_PAID_ORDER_MAIL_ENABLED'].some(k=>env[k]!=='0'))
    return reply({error:'Paused checkout and disabled order mail required.'},409);
   let config:ReturnType<typeof livePaymentConfig>;
   try{config=livePaymentConfig(env);}catch{return reply({error:'Production payment configuration incomplete.'},503);}
   if(!await deps.schema())return reply({error:'Production payment schema unverified.'},503);
   const account=await deps.account(config.key);
   const merchantMatches=account.id===config.accountId;
   const chargesEnabled=account.charges_enabled===true,detailsSubmitted=account.details_submitted===true;
   return reply({configurationValid:true,schemaValid:true,merchantMatches,chargesEnabled,detailsSubmitted,
    checkoutPaused:true,orderMailDisabled:true,activationPerformed:false,
    reconciliationVerified:false},merchantMatches&&chargesEnabled&&detailsSubmitted?200:503);
  }catch{return reply({error:'Read-only payment verification unavailable.'},503);}
 };
}
