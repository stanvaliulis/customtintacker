import {createHash,randomUUID} from 'node:crypto';
import {address,quoteDirect,type Address,type CartItem} from './direct-rates';
import {packingVersion,profiles} from './fixtures';
type Config=NonNullable<Parameters<typeof quoteDirect>[1]> & {pickupConfirmed:boolean;version:string;shipDate:string};
type Result=Awaited<ReturnType<typeof quoteDirect>>;
type RecordValue={owner:string;binding:string;expires:number;result:Result};
export interface QuoteStore {put(id:string,value:RecordValue):Promise<void>;get(id:string):Promise<RecordValue|undefined>}
/** Bounded ephemeral store, for local tests. Eviction/restart fails closed. */
export function memoryQuoteStore(clock=Date.now):QuoteStore {
 const records=new Map<string,RecordValue>();
 return {async put(id,value){for(const [key,v] of records)if(v.expires<=clock())records.delete(key);if(records.size>=500)records.delete(records.keys().next().value!);records.set(id,structuredClone(value));},async get(id){const v=records.get(id);if(v&&v.expires<=clock()){records.delete(id);return;}return v?structuredClone(v):undefined;}};
}
const review=(reason:string)=>({status:'shipping-review-required',payable:false,reason});
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function parse(raw:unknown){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid shipping request.');
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).some(k=>!['items','destination','quoteId'].includes(k))||!Array.isArray(r.items)||r.items.length!==1)throw Error('A supported single-product cart is required.');
 const items:CartItem[]=r.items.map(v=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['productId','quantity','backing'].includes(k))||v.backing!=='standard-024'||typeof v.productId!=='string'||v.productId.length>100||!Number.isSafeInteger(v.quantity)||v.quantity<1||v.quantity>10000)throw Error('Standard aluminum backing and a valid cart are required.');return {productId:v.productId,quantity:v.quantity};});
 const d=r.destination as Address;if(!d||Object.keys(d).some(k=>!['streetLines','city','state','postalCode','country','residential'].includes(k)))throw Error('Invalid destination.');
 if(r.quoteId!==undefined&&(typeof r.quoteId!=='string'||!/^[a-f0-9-]{36}$/.test(r.quoteId)))throw Error('Invalid quote reference.');
 return {items,destination:address(d),quoteId:r.quoteId as string|undefined};
}
export function quoteService(deps:{store:QuoteStore;config:()=>Config|undefined;owner:(request:Request)=>Promise<string|undefined>;catalog:(items:CartItem[])=>Promise<string|undefined>;clock?:()=>number}){
 return async(request:Request,raw:unknown)=>{
  const input=parse(raw),config=deps.config();
  if(!config||!config.pickupConfirmed)return review('Direct carrier rating and pickup method are not configured. Staff must confirm shipping.');
  const owner=await deps.owner(request);if(!owner)return review('A valid customer session is required.');
  // Catalog resolver must validate supported product/variant/quantity and return
  // a server-controlled revision. Client amounts, dimensions and owners rejected.
  const catalogVersion=await deps.catalog(input.items);if(!catalogVersion)return review('Product or variant requires staff packing review.');
  const now=(deps.clock??Date.now)();
  const packing=input.items.map(i=>Object.hasOwn(profiles,i.productId)?profiles[i.productId]:null);
  const binding=digest({owner,items:input.items,destination:input.destination,catalogVersion,packingVersion,packing,configVersion:config.version,origin:config.origin,services:config.allowedServices,carrier:config.carrier.id,shipDate:config.shipDate});
  if(input.quoteId){const saved=await deps.store.get(input.quoteId);if(!saved||saved.owner!==owner||saved.binding!==binding||saved.expires<=now)return review('Estimate is stale or unavailable. Request a new estimate.');return {...saved.result,quoteId:input.quoteId};}
  const result=await quoteDirect({ownerId:owner,items:input.items,destination:input.destination,shipDate:config.shipDate},config,now);
  if(result.status!=='account-rate-estimate')return result;
  const quoteId=randomUUID();await deps.store.put(quoteId,{owner,binding,expires:Date.parse(result.expiresAt),result});return {...result,quoteId};
 };
}
