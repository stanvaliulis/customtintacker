import {productionContext} from '@/lib/persistence/server';
import {requireSameOrigin,boundedJson} from '@/lib/persistence/request-security';
import {saveOwnedArtwork} from '@/lib/persistence/artwork-save';
import {failure} from '@/lib/commerce/runtime';
import {rateLimit} from '@/lib/spam-protection';
export async function POST(req:Request){try{requireSameOrigin(req);const limited=rateLimit(req);if(limited)return limited;const body=await boundedJson(req),d=await productionContext();return Response.json(await saveOwnedArtwork(body,{...d,repository:d.storage}),{headers:{'Cache-Control':'no-store'}});}catch(e){if(process.env.VERCEL_ENV==='preview'&&process.env.TIN_ISOLATED_PREVIEW==='1')console.warn('ISOLATED_SAVE_FAILURE',e instanceof Error?e.name:'Unknown',e instanceof Error&&e.name==='StorageError'?e.message:'Sanitized unexpected persistence error');return failure(e);}}
