import {requestInvoice} from '@/lib/commerce/invoice';
import {productionContext} from '@/lib/persistence/server';
import {requireSameOrigin,boundedJson} from '@/lib/persistence/request-security';
import {failure} from '@/lib/commerce/runtime';
import {detectSpam,rateLimit} from '@/lib/spam-protection';
export async function POST(req:Request){
 try{
  requireSameOrigin(req);const limited=rateLimit(req);if(limited)return limited;
  const body=await boundedJson(req,256*1024),spam=detectSpam(body as Record<string,unknown>);if(spam)return spam;
  const d=await productionContext();
  return Response.json(await requestInvoice(body,req.headers.get('idempotency-key')||'',{...d,repository:d.invoices}),{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}
}
