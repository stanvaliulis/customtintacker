import {productionContext} from '@/lib/persistence/server';
import {requireSameOrigin} from '@/lib/persistence/request-security';
import {failure} from '@/lib/commerce/runtime';
import {rateLimit} from '@/lib/spam-protection';
export async function POST(req:Request){try{requireSameOrigin(req);const limited=rateLimit(req);if(limited)return limited;await productionContext(true);return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
