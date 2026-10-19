import { timingSafeEqual } from 'node:crypto';
import { createDistributorRecovery, distributorRecoveryEnabled } from '@/lib/distributor-recovery';
import { distributorRecoveryEmail } from '@/lib/distributor-recovery-email';
import { canSendSensitiveEmail, sendEmailTo } from '@/lib/email';
import { privateHeaders } from '@/lib/distributor-recovery-http';
export const runtime='nodejs';
// No cron is configured; activation/delivery require explicit operational approval.
export async function POST(request:Request) {
  const secret=process.env.CRON_SECRET||'', supplied=request.headers.get('authorization')||'';
  const expected=`Bearer ${secret}`;
  if(secret.length<32 || Buffer.byteLength(supplied)!==Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))
    return Response.json({error:'Unauthorized'},{status:401,headers:privateHeaders});
  if(!distributorRecoveryEnabled() || process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED!=='1' || !canSendSensitiveEmail())
    return Response.json({error:'Recovery delivery unavailable'},{status:503,headers:privateHeaders});
  try {
    const {prisma}=await import('@/lib/db');
    const processed=await createDistributorRecovery(prisma,process.env.AUTH_SECRET||'').deliverOne(async(email,url)=>{
      await sendEmailTo(email,distributorRecoveryEmail(url),{sensitive:true});
    });
    return Response.json({processed},{headers:privateHeaders});
  }catch{return Response.json({error:'Recovery delivery unavailable'},{status:503,headers:privateHeaders});}
}
// Vercel Cron uses GET; the same bearer authorization and feature gates apply.
export const GET=POST;
