export const US_SHIPPING_REGIONS='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI AA AE AP'.split(' ');
/** Destination intake only, not address validation, service eligibility or rating. */
export function staffShippingIntake(raw:Record<string,unknown>){
 const fields=['shippingAddress','city','state','zip','shippingCountry','shippingAddressType'];
 if(!fields.some(k=>raw[k]!==undefined&&raw[k]!==''))return null; // Historical requests remain readable/retryable.
 const text=(key:string,max:number)=>{const v=raw[key];if(typeof v!=='string'||!v.trim()||v.length>max||/[\x00-\x1f]/.test(v))throw Error('Complete shipping destination required.');return v.trim().replace(/\s+/g,' ');};
 const shippingAddress=text('shippingAddress',300),city=text('city',100),state=text('state',2).toUpperCase(),zip=text('zip',10),shippingCountry=text('shippingCountry',2),shippingAddressType=text('shippingAddressType',20);
 if(shippingCountry!=='US'||!US_SHIPPING_REGIONS.includes(state)||!/^\d{5}(-\d{4})?$/.test(zip)||!['business','residential','unsure'].includes(shippingAddressType))throw Error('Use a US destination and valid state/territory and ZIP; other destinations require a custom quote.');
 return {shippingAddress,city,state,zip,shippingCountry,shippingAddressType,shippingReviewStatus:'staff-quote-required'};
}
