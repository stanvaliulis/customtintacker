import type {CartItem,Product} from '@/types/product';
/** Validate device data before it reaches reducers/totals. Prices remain server-validated at checkout. */
export function readCart(raw:string,products:Product[]):CartItem[]{
 if(raw.length>2*1024*1024)throw Error('Saved cart is too large.');
 const value=JSON.parse(raw);if(!Array.isArray(value)||value.length>103)throw Error('Invalid saved cart.');
 const seen=new Set<string>();
 return value.map(item=>{
  const product=products.find(p=>p.id===item?.product?.id);
  if(!product||seen.has(product.id)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>1000000||!Number.isSafeInteger(item.unitPrice)||item.unitPrice<0||!product.backingOptions.includes(item.selectedBacking)||!['retail','distributor'].includes(item.priceTier||'retail')||(item.isRush!==undefined&&typeof item.isRush!=='boolean'))throw Error('Invalid saved cart item.');
  seen.add(product.id);
  const a=item.proofAttachment;
  if(a&&(!item.designId||a.designId!==item.designId||a.productId!==product.id||a.reviewStatus!=='unapproved'||!/^POP-[A-F0-9]{8}$/.test(a.reviewVersion)||!/^[a-f0-9]{64}$/.test(a.sourceHash)))throw Error('Invalid saved proof attachment.');
  return {...item,product,priceTier:item.priceTier||'retail'};
 });
}
