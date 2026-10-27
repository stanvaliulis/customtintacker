import {quotePost} from '@/lib/shipping/quote-http';
import {quoteService,memoryQuoteStore} from '@/lib/shipping/quote-service';
import {rateLimit} from '@/lib/spam-protection';
import {catalogBinding} from '@/lib/shipping/catalog-binding';
export const runtime='nodejs';
// Deliberately disconnected. No env secret reads, customer storage, DB or wire.
// Deployment composition requires reviewed carrier/session/catalog configuration.
const handle=quotePost(quoteService({store:memoryQuoteStore(),config:()=>undefined,
 owner:async()=>{const {productionContext}=await import('@/lib/persistence/server');return (await (await productionContext(false)).principal()).ownerId;},
 catalog:catalogBinding(async id=>{const {getProductById}=await import('@/lib/products');return getProductById(id);})}));
export async function POST(req:Request){const limited=rateLimit(req);if(limited){limited.headers.set('Cache-Control','no-store');return limited;}return handle(req);}
