import 'server-only';
import Stripe from 'stripe';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {prisma} from '@/lib/db';
import {paymentReadinessHandler} from '@/lib/commerce/payment-readiness';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=paymentReadinessHandler({
 authenticate:isAdminAuthenticated,
 env:()=>process.env,
 schema:async()=>{
  const marker=await prisma.$queryRawUnsafe<Array<{marker:string|null}>>("SELECT to_regclass('tin_preview.identity')::text marker");
  if(marker.length!==1||marker[0].marker)return false;
  const rows=await prisma.$queryRawUnsafe<Array<{contract:string;version:number}>>("SELECT i.contract,s.version FROM tin_payments.launch_identity i CROSS JOIN tin_payments.schema_version s WHERE i.id='customtintackers-production'");
  return rows.length===1&&rows[0].contract==='staff-reviewed-manual-v1'&&rows[0].version===1;
 },
 // No account parameter or Stripe-Account override: SDK issues only GET /v1/account.
 account:async key=>{
  const a=await new Stripe(key,{maxNetworkRetries:0,timeout:10000}).accounts.retrieve();
  return {id:a.id,charges_enabled:a.charges_enabled,details_submitted:a.details_submitted};
 },
});
