import {createHash} from 'node:crypto';
import {profiles, packingVersion} from './fixtures';

// Internal server module only. No environment reads, fetch, tokens, persistence,
// checkout integration or label/pickup operations. Transport must be supplied.
export type Address = {streetLines:string[];city:string;state:string;postalCode:string;country:'US';residential:boolean};
export type CartItem = {productId:string;quantity:number};
export type Parcel = {dimensionsIn:number[];weightLb:number;quantity:number};
export type Shipment = {origin:Address;destination:Address;shipDate:string;parcels:Parcel[]};
export type AccountRate = {service:string;currency:'USD';cents:number};
export type Transport = (path:string,body:unknown,signal:AbortSignal)=>Promise<unknown>;
export interface Carrier {id:'ups'|'fedex';rates(s:Shipment,signal:AbortSignal):Promise<AccountRate[]>}
const review=(reason:string)=>({status:'shipping-review-required' as const,payable:false as const,reason});
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const states=new Set('AL AZ AR CA CO CT DE FL GA ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '));
export function address(value:Address):Address {
 if(!value||value.country!=='US'||!states.has(value.state)||!/^\d{5}(-\d{4})?$/.test(value.postalCode)||typeof value.residential!=='boolean'||!Array.isArray(value.streetLines)||value.streetLines.length<1||value.streetLines.length>2)throw Error('Address review required');
 const clean=(s:string)=>{if(typeof s!=='string'||!s.trim()||s.length>100||/[\x00-\x1f]/.test(s))throw Error('Address review required');return s.trim().replace(/\s+/g,' ');};
 return {country:'US',state:value.state,postalCode:value.postalCode,city:clean(value.city),streetLines:value.streetLines.map(clean),residential:value.residential};
}
function cents(value:unknown):number {
 if((typeof value!=='number'&&typeof value!=='string')||!/^\d+(\.\d{1,2})?$/.test(String(value)))throw Error('Invalid account rate');
 const amount=Math.round(Number(value)*100);if(!Number.isSafeInteger(amount)||amount<=0||amount>10000000)throw Error('Invalid account rate');return amount;
}
// Carrier responses are untrusted JSON: inspect only documented fields.
type Json = Record<string,any>; // eslint-disable-line @typescript-eslint/no-explicit-any
function object(value:unknown):Json {if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid carrier response');return value as Json;}
const array=(value:unknown):unknown[]=>Array.isArray(value)?value:value?[value]:[];
function upsAddress(a:Address){return {AddressLine:a.streetLines,City:a.city,StateProvinceCode:a.state,PostalCode:a.postalCode,CountryCode:a.country,...(a.residential?{ResidentialAddressIndicator:'Y'}:{})};}
export function upsCarrier(accountNumber:string,transport:Transport):Carrier {
 if(!accountNumber.trim())throw Error('UPS account required');
 return {id:'ups',async rates(s,signal){
  const result=object(await transport('/rating/v2409/Shop',{RateRequest:{Request:{RequestOption:'Shop'},Shipment:{Shipper:{ShipperNumber:accountNumber,Address:upsAddress(s.origin)},ShipFrom:{Address:upsAddress(s.origin)},ShipTo:{Address:upsAddress(s.destination)},ShipmentRatingOptions:{NegotiatedRatesIndicator:'Y'},Package:s.parcels.map(p=>({PackagingType:{Code:'02'},Dimensions:{UnitOfMeasurement:{Code:'IN'},Length:String(p.dimensionsIn[0]),Width:String(p.dimensionsIn[1]),Height:String(p.dimensionsIn[2])},PackageWeight:{UnitOfMeasurement:{Code:'LBS'},Weight:String(p.weightLb)}}))}}},signal));
  return array(result.RateResponse?.RatedShipment).flatMap(raw=>{const r=object(raw),total=r.NegotiatedRateCharges?.TotalCharge;if(!total)return [];if(total.CurrencyCode!=='USD'||typeof r.Service?.Code!=='string')throw Error('Invalid UPS rate');return [{service:r.Service.Code,currency:'USD' as const,cents:cents(total.MonetaryValue)}];});
 }};
}
function fedexAddress(a:Address){return {streetLines:a.streetLines,city:a.city,stateOrProvinceCode:a.state,postalCode:a.postalCode,countryCode:a.country,residential:a.residential};}
export function fedexCarrier(accountNumber:string,pickupType:'USE_SCHEDULED_PICKUP'|'DROPOFF_AT_FEDEX_LOCATION',transport:Transport):Carrier {
 if(!accountNumber.trim())throw Error('FedEx account required');
 return {id:'fedex',async rates(s,signal){
  const result=object(await transport('/rate/v1/rates/quotes',{accountNumber:{value:accountNumber},requestedShipment:{shipper:{address:fedexAddress(s.origin)},recipient:{address:fedexAddress(s.destination)},shipDateStamp:s.shipDate,pickupType,packagingType:'YOUR_PACKAGING',rateRequestType:['ACCOUNT'],totalPackageCount:s.parcels.length,requestedPackageLineItems:s.parcels.map((p,i)=>({sequenceNumber:i+1,groupPackageCount:1,weight:{units:'LB',value:p.weightLb},dimensions:{length:p.dimensionsIn[0],width:p.dimensionsIn[1],height:p.dimensionsIn[2],units:'IN'}}))}},signal));
  return array(result.output?.rateReplyDetails).flatMap(raw=>{const r=object(raw);return array(r.ratedShipmentDetails).flatMap(detail=>{const d=object(detail);if(d.rateType!=='ACCOUNT')return [];if(d.shipmentRateDetail?.currency!=='USD'||typeof r.serviceType!=='string')throw Error('Invalid FedEx rate');return [{service:r.serviceType,currency:'USD' as const,cents:cents(d.totalNetCharge)}];});});
 }};
}
export type QuoteInput={ownerId:string;items:CartItem[];destination:Address;shipDate:string};
// Configuration is trusted server input, NEVER request-body data. Services must
// be explicitly approved before any rate is offered. None are enabled here.
export async function quoteDirect(input:QuoteInput,config?:{origin:Address;carrier:Carrier;allowedServices:string[]},now=Date.now(),timeoutMs=5000){
 if(!config)return {status:'unconfigured' as const,payable:false as const,reason:'Direct carrier rating is not connected.'};
 let destination:Address,origin:Address;
 try{destination=address(input.destination);origin=address(config.origin);}catch{return review('A complete supported US address and residential classification are required.');}
 if(origin.postalCode.slice(0,5)!=='61115')return review('Ship-from origin requires confirmation.');
 if(!input.ownerId||!Number.isFinite(now)||!/^\d{4}-\d{2}-\d{2}$/.test(input.shipDate)||!Number.isFinite(Date.parse(input.shipDate))||new Date(input.shipDate).toISOString().slice(0,10)!==input.shipDate||input.shipDate<new Date(now).toISOString().slice(0,10))return review('Owner and planned ship date are required.');
 if(config.carrier.id==='ups'&&input.shipDate!==new Date(now).toISOString().slice(0,10))return review('Future-date UPS rating is not implemented; staff review required.');
 if(!config.allowedServices.length)return review('No carrier services have been approved.');
 if(!Array.isArray(input.items)||input.items.length!==1)return review('Mixed, custom or freight packing requires staff review.');
 const item=input.items[0],profile=Object.hasOwn(profiles,item.productId)?profiles[item.productId]:undefined;
 if(!profile||!Number.isSafeInteger(item.quantity)||item.quantity<50||item.quantity>250)return review('Product or quantity requires packing review.');
 const parcels:Parcel[]=[];
 for(let left=item.quantity;left>0;left-=profile.capacity){const quantity=Math.min(left,profile.capacity),weightLb=Math.ceil((quantity*profile.unitLb+profile.tareLb)*100)/100;if(weightLb>40)return review('Freight or heavy packing requires review.');parcels.push({quantity,dimensionsIn:[...profile.dimensions],weightLb});}
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const rates=await Promise.race([config.carrier.rates({origin,destination,shipDate:input.shipDate,parcels},controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Timeout'));},timeoutMs);})]);
  const eligible=rates.filter(r=>config.allowedServices.includes(r.service)&&r.currency==='USD'&&Number.isSafeInteger(r.cents)&&r.cents>0);
  if(!eligible.length)return review('No usable account rate for an approved service; staff review required.');
  const expiresAt=new Date(now+15*60*1000).toISOString();
  return {status:'account-rate-estimate' as const,payable:false as const,packingStatus:'estimated-not-measured' as const,packingVersion,parcels,expiresAt,rates:eligible.map(rate=>({...rate,carrier:config.carrier.id,binding:hash({owner:input.ownerId,items:input.items,destination,origin,shipDate:input.shipDate,packingVersion,parcels,rate,carrier:config.carrier.id,expiresAt})})),notice:'Carrier estimate for guessed packing only. Not a payable quote, address validation or delivery guarantee. Staff must confirm packing and final shipping.'};
 }catch{return {status:'provider-unavailable' as const,payable:false as const,reason:'Carrier rating unavailable; staff review required.'};}finally{if(timer)clearTimeout(timer);}
}
// Display freshness only; hashes are NOT authorization or redeemable tokens.
export function estimateFresh(expiresAt:string,now=Date.now()){return Number.isFinite(Date.parse(expiresAt))&&now<Date.parse(expiresAt);}
