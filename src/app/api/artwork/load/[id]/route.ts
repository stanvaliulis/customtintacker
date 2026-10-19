import {productionContext} from '@/lib/persistence/server';
import {failure} from '@/lib/commerce/runtime';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;if(!/^design-[a-f0-9]{64}$/.test(id))return Response.json({error:'Private artwork ID required.'},{status:400});const d=await productionContext(),who=await d.principal(),record=await d.design(id,who.ownerId);return record?Response.json(record,{headers:{'Cache-Control':'private, no-store'}}):Response.json({error:'Artwork unavailable.'},{status:404});}catch(e){return failure(e);}}
