/** Pure preflight: no credentials returned, provider calls, activation or configuration writes. */
export function firstLaunchReadiness(values:Record<string,string|undefined>){
 const blockers:string[]=[];
 if(values.TIN_CHECKOUT_PAUSED!=='0')blockers.push('Checkout remains paused until explicit launch.');
 if(values.VERCEL_ENV!=='production'||values.TIN_ISOLATED_PREVIEW==='1')blockers.push('Production environment required for live activation.');
 if(values.TIN_REVIEWED_LIVE_ENABLED!=='1')blockers.push('Live payment activation is not approved/configured.');
 if(!/^(sk|rk)_live_/.test(values.TIN_STRIPE_LIVE_SECRET_KEY||''))blockers.push('Production-only live Stripe credential is missing.');
 if(!values.TIN_STRIPE_LIVE_WEBHOOK_SECRET?.startsWith('whsec_'))blockers.push('Live signature-verification credential is missing.');
 if(values.TIN_STRIPE_ACCOUNT_ID!=='acct_1TO24PIpmMqjUaQp')blockers.push('Interstate Graphics merchant account must be verified.');
 if(values.TIN_PAYMENTS_RETURN_ORIGIN!=='https://www.customtintackers.com')blockers.push('Approved exact customer return origin is missing.');
 if(values.TIN_PRODUCTION_PAYMENT_SCHEMA_VERIFIED!=='1')blockers.push('Production payment schema, ownership and recovery checks are pending.');
 if(values.TIN_MANUAL_FULFILLMENT!=='1')blockers.push('Manual fulfillment and held handoff must be selected.');
 if(values.TIN_PRINTIQ_ENABLED==='1'||values.TIN_AUTOMATIC_PRODUCTION_RELEASE==='1')blockers.push('Automatic fulfillment is outside first-launch scope.');
 const emailBlockers:string[]=[];
 if(values.TIN_PAID_ORDER_MAIL_ENABLED!=='1')emailBlockers.push('Completed-order staff delivery is not active.');
 if(values.TIN_INVOICE_MAIL_ENABLED!=='1')emailBlockers.push('Staff invoice email activation is not approved/configured.');
 if(!values.RESEND_API_KEY||!values.RESEND_FROM)emailBlockers.push('Existing verified sender configuration is required.');
 if(values.NOTIFICATION_EMAIL!=='sales@customtintackers.com')emailBlockers.push('Confirm one staff inbox: invoice transport currently requires sales@customtintackers.com.');
 return {paymentReady:blockers.length===0,paymentBlockers:blockers,emailReady:emailBlockers.length===0,emailBlockers,productionReleased:false as const,activationPerformed:false as const};
}
