import { createDistributorRecovery, distributorRecoveryEnabled } from '@/lib/distributor-recovery';
import { privateHeaders, validRecoveryOrigin, recoveryBody } from '@/lib/distributor-recovery-http';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!validRecoveryOrigin(request))return Response.json({error:'Forbidden'},{status:403,headers:privateHeaders});
  try {
    const body=await recoveryBody(request);
    if(distributorRecoveryEnabled()) {
      const {prisma}=await import('@/lib/db');
      if(await createDistributorRecovery(prisma,process.env.AUTH_SECRET||'').complete(body.token,body.password))
        return Response.json({ok:true},{headers:privateHeaders});
    }
  }catch{/* No tokens, passwords, provider errors or account details in logs/responses. */}
  return Response.json({error:'This link is invalid or expired, or the password does not meet the requirements. Request a new link if needed.'},{status:400,headers:privateHeaders});
}
