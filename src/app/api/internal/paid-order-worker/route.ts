import {runPaidOrderWorker} from '@/lib/persistence/paid-order-worker';
import {failure} from '@/lib/commerce/runtime';
export async function GET(req:Request){try{return Response.json({result:await runPaidOrderWorker(req)},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
