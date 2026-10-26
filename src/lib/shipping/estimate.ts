import {createHash} from 'node:crypto';
import {profiles,packingVersion,tariff,fixtureProvider,type RateProvider} from './fixtures';
export class EstimateInputError extends Error {}
const review=(reason:string)=>({status:'shipping-review-required' as const,reason,payable:false as const});
function hash(v:unknown){return createHash('sha256').update(JSON.stringify(v)).digest('hex');}
export function dimensionalWeight(dimensions:readonly number[],grossLb:number){const volume=dimensions.reduce((a,b)=>a*b,1);return Math.max(Math.ceil(grossLb),volume>1728?Math.ceil(volume/tariff.dimDivisor):0);}
/** No persistence, carrier calls, secrets, checkout integration or redeemable quotes. */
export function estimateShipping(raw:unknown,now=Date.now(),provider:RateProvider=fixtureProvider){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new EstimateInputError('Invalid request.');
 const input=raw as Record<string,unknown>;
 if(Object.keys(input).some(k=>!['items','destination'].includes(k)))throw new EstimateInputError('Only items and destination are accepted.');
 if(!Array.isArray(input.items)||!input.items.length||input.items.length>20)throw new EstimateInputError('A bounded cart is required.');
 const dest=input.destination as Record<string,unknown>;
 if(!dest||typeof dest!=='object'||Array.isArray(dest)||Object.keys(dest).some(k=>!['country','postalCode','address'].includes(k))||dest.country!=='US'||typeof dest.postalCode!=='string'||!/^\d{5}$/.test(dest.postalCode))throw new EstimateInputError('Use a five-digit US ZIP code.');
 if(dest.address!==undefined&&(typeof dest.address!=='string'||dest.address.length>300))throw new EstimateInputError('Invalid address.');
 const address={country:'US',postalCode:dest.postalCode,address:typeof dest.address==='string'?dest.address.trim().replace(/\s+/g,' '):''};
 const items=input.items.map((item:unknown)=>{if(!item||typeof item!=='object'||Array.isArray(item))throw new EstimateInputError('Invalid item.');const i=item as Record<string,unknown>;if(Object.keys(i).some(k=>!['productId','quantity'].includes(k))||typeof i.productId!=='string'||i.productId.length>100||!Number.isSafeInteger(i.quantity)||Number(i.quantity)<1||Number(i.quantity)>10000)throw new EstimateInputError('Invalid product or quantity.');return {productId:i.productId,quantity:Number(i.quantity)};});
 if(!Number.isFinite(now)||now<Date.parse(tariff.effectiveAt)||now>=Date.parse(tariff.expiresAt))return review('Research tariff needs review.');
 const zone=tariff.zones[address.postalCode];if(!zone)return review('Destination is outside the three verified benchmark ZIP codes.');
 if(items.length!==1)return review('Mixed or duplicate-line carts need a packing review.');
 const item=items[0],profile=Object.hasOwn(profiles,item.productId)?profiles[item.productId]:undefined;if(!profile)return review('Custom, vinyl, bottle-cap or unmeasured products need a packing review.');
 if(item.quantity<50||item.quantity>250)return review('Only quantities 50 through 250 are covered by this research profile.');
 const parcels=[];for(let remaining=item.quantity;remaining>0;remaining-=profile.capacity){const quantity=Math.min(remaining,profile.capacity),grossLb=profile.unitLb*quantity+profile.tareLb;
 if(grossLb>40)return review('Parcel exceeds the provisional packing weight limit.');
 const billableLb=dimensionalWeight(profile.dimensions,grossLb);let postageCents:number|null;try{postageCents=provider.rate(billableLb,zone);}catch{return review('Rate research unavailable; staff review required.');}
 if(!Number.isSafeInteger(postageCents)||Number(postageCents)<=0)return review('No verified tariff fixture for this parcel.');
 parcels.push({quantity,dimensionsIn:profile.dimensions,estimatedGrossLb:Math.round(grossLb*100)/100,billableLb,postageCents:Number(postageCents)});}
 const expiresAt=new Date(Math.min(now+15*60*1000,Date.parse(tariff.expiresAt))).toISOString();
 const binding={items,destination:address,packingVersion,tariffVersion:provider.version,service:'USPS Ground Advantage commercial research',expiresAt};
 return {status:'estimate' as const,payable:false as const,estimateId:hash(binding),cartDestinationHash:hash({items,destination:address}),packingVersion,tariffVersion:provider.version,source:tariff.source,checkedAt:tariff.checkedAt,expiresAt,originZip:tariff.originZip,zone,parcels,postageCents:parcels.reduce((n,p)=>n+p.postageCents,0),currency:'USD',uncertainty:'Packing is estimated, not measured. Commercial eligibility and actual carrier acceptance are unverified. Postage only: excludes boxes, packing labor, extra insurance, signatures and on-demand pickup. This is not a final shipping quote or delivery guarantee. Staff must confirm shipping before payment.'};
}
