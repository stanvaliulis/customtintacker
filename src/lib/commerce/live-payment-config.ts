import {CommerceError} from './service';
/** Inert until separately approved production-only configuration and schema are installed. */
export function livePaymentConfig(env:Record<string,string|undefined>){
 if(env.VERCEL_ENV!=='production'||env.TIN_ISOLATED_PREVIEW==='1'||env.TIN_REVIEWED_LIVE_ENABLED!=='1'||env.TIN_MANUAL_FULFILLMENT!=='1'||env.TIN_PRINTIQ_ENABLED==='1'||env.TIN_AUTOMATIC_PRODUCTION_RELEASE==='1')throw new CommerceError('Live reviewed payments are not active.',503);
 const key=env.TIN_STRIPE_LIVE_SECRET_KEY||'',signingSecret=env.TIN_STRIPE_LIVE_WEBHOOK_SECRET||'',accountId=env.TIN_STRIPE_ACCOUNT_ID||'',returnOrigin=env.TIN_PAYMENTS_RETURN_ORIGIN||'';
 if(!/^(sk|rk)_live_/.test(key)||!signingSecret.startsWith('whsec_')||signingSecret.length<16||accountId!=='acct_1TO24PIpmMqjUaQp'||returnOrigin!=='https://www.customtintackers.com')throw new CommerceError('Approved live payment configuration required.',503);
 let host:string;try{host=new URL(env.POSTGRES_PRISMA_URL||'').hostname;}catch{throw new CommerceError('Production payment database required.',503);}
 if(!env.TIN_LIVE_DATABASE_HOST||host!==env.TIN_LIVE_DATABASE_HOST||!host.endsWith('.neon.tech')||host==='ep-late-firefly-b8vzgzil-pooler.c-14.us-east-1.aws.neon.tech')throw new CommerceError('Verified production payment database required.',503);
 return {key,signingSecret,accountId,returnOrigin,live:true as const};
}
