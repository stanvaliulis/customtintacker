import {runInvoiceWorker} from '@/lib/persistence/invoice-worker';
import {failure} from '@/lib/commerce/runtime';
export async function GET(req:Request){try{return Response.json({result:await runInvoiceWorker(req)},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
