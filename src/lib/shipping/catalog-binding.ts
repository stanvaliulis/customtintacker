import {createHash} from 'node:crypto';
import type {Product} from '@/types/product';
import type {CartItem} from './direct-rates';
const measuredProductSize:Record<string,[number,number]>={
 '18-inch-square-tacker':[18,18],'18-inch-circle-tacker':[18,18],
 '12-inch-circle-tacker':[11.5,11.5],'9x17-can-tacker':[9,17.5],
};
/** Resolve authoritative product data, not client product snapshots. */
export function catalogBinding(load:(id:string)=>Promise<Product|null>){return async(items:CartItem[])=>{
 if(items.length!==1)return;
 const item=items[0],expected=Object.hasOwn(measuredProductSize,item.productId)?measuredProductSize[item.productId]:undefined;
 if(!expected)return;
 const p=await load(item.productId);
 if(!p||!p.inStock||item.quantity<p.minimumOrder||!p.backingOptions.includes('standard-024')||p.dimensions.width!==expected[0]||p.dimensions.height!==expected[1]||!p.metadata.material.toLowerCase().includes('aluminum'))return;
 return createHash('sha256').update(JSON.stringify({id:p.id,dimensions:p.dimensions,minimum:p.minimumOrder,backing:p.backingOptions,metadata:p.metadata})).digest('hex');
};}
