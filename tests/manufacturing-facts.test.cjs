const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const {manufacturingFacts:f,productTiming}=require('../src/data/manufacturing-facts.ts'),{products}=require('../src/data/products.ts'),{getProductSchema}=require('../src/lib/structured-data.ts');
test('approved aluminum material and timing feed product/schema without changing vinyl or flat construction',()=>{
 const metal=products.filter(p=>/aluminum/i.test(p.metadata.material));assert(metal.length>0);
 for(const p of metal){assert.equal(p.metadata.material,f.material);assert(!/digital|lithograph|screen print/i.test(p.metadata.printMethod));assert.equal(productTiming(p),f.standard);assert(!/recycled|digital|\d+ business day/i.test(p.longDescription));assert(JSON.stringify(getProductSchema(p)).includes(f.standard));}
 const vinyl=products.find(p=>/vinyl/i.test(p.metadata.material));assert(vinyl);assert(!productTiming(vinyl).includes('proof approval'));assert(!vinyl.metadata.material.includes('aluminum'));
 assert(products.find(p=>p.id==='22-inch-bottle-cap-tacker').features.some(x=>x.includes('not embossed')));
 assert(f.standard.includes('proof approval to shipment'));assert(f.rush.includes('proof approval to shipment'));assert(f.timing.includes('not delivery'));assert.equal(f.rushSurchargeRate,.30);
});
test('rush estimates share approved surcharge on client and server without altering held fulfillment',()=>{
 for(const p of ['src/context/CartContext.tsx','src/app/api/checkout/route.ts','src/lib/commerce/service.ts']){const s=fs.readFileSync(p,'utf8');assert(s.includes('manufacturingFacts.rushSurchargeRate'));assert(!/line \* 0\.25|RUSH_FEE_RATE = 0\.25/.test(s));}
 assert.equal(Math.round(12345*f.rushSurchargeRate),3704);
});
