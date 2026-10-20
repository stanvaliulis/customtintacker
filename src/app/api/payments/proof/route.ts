import {paymentProof} from '@/lib/persistence/payments';
import {failure} from '@/lib/commerce/runtime';
export const runtime='nodejs';
export async function GET(req:Request){try{const q=new URL(req.url).searchParams,result=await paymentProof(q.get('invoice_id')||'',q.get('artifact_id')||'');return new Response(new Uint8Array(result.bytes),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${result.name}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}catch(e){return failure(e);}}
