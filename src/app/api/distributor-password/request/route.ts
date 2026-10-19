import { createDistributorRecovery, distributorRecoveryEnabled, RECOVERY_MESSAGE } from '@/lib/distributor-recovery';
import { privateHeaders, validRecoveryOrigin, recoveryBody } from '@/lib/distributor-recovery-http';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!validRecoveryOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers:privateHeaders});
  try {
    const body=await recoveryBody(request);
    if(distributorRecoveryEnabled()) {
      const {prisma}=await import('@/lib/db');
      await createDistributorRecovery(prisma,process.env.AUTH_SECRET||'').request(body.email);
    }
  }catch{/* Same public result for invalid, unavailable, throttled and ineligible requests. */}
  return Response.json({message:RECOVERY_MESSAGE},{headers:privateHeaders});
}
