const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const {signBuyingGuide,aluminumBuyingAnswer}=require('../src/data/sign-buying-guide.ts');
const {products}=require('../src/data/products.ts');
const {getProductSchema}=require('../src/lib/structured-data.ts');
const {industries}=require('../src/data/industries.ts');
test('buyer intent links resolve to existing pages and accurate product constructions',()=>{
 assert.equal(new Set(signBuyingGuide.map(x=>x.href)).size,signBuyingGuide.length);
 for(const item of signBuyingGuide){
  if(item.href.startsWith('/products/'))assert(products.some(p=>'/products/'+p.slug===item.href));
  else if(item.href.startsWith('/blog/')){const {blogPosts}=require('../src/data/blog-posts.ts');assert(blogPosts.some(p=>'/blog/'+p.slug===item.href));}
  else assert(industries.some(i=>'/'+i.slug===item.href));
 }
 const cap=products.find(p=>p.slug==='22-inch-bottle-cap-tacker');
 assert(cap.features.some(x=>/not embossed/i.test(x)));
 assert.match(signBuyingGuide[4].text,/flat, not embossed/);
 assert.match(signBuyingGuide[3].text,/team must confirm/i);
 assert.match(signBuyingGuide[0].text,/Flat metal and vinyl signs are separate/);
});
test('shared answers retain confirmed production and transit distinctions',()=>{
 for(const text of ['.024-inch','white on both sides','direct print','2-3 weeks','1-2 weeks','30%','proof approval to shipment','not delivery','Transit time is additional','not two-sided artwork printing'])assert(aluminumBuyingAnswer.replace(/[\u2013\u2011]/g, '-').includes(text),text);
 assert(!/free shipping|guaranteed|recycled|no setup/i.test(aluminumBuyingAnswer));
});
test('existing canonical product schema stays tied to actual catalog facts',()=>{
 for(const product of products){const schema=getProductSchema(product);assert.equal(schema.url,'https://www.customtintackers.com/products/'+product.slug);assert.equal(schema.description,product.longDescription);}
 const catalog=fs.readFileSync('src/app/products/page.tsx','utf8');
 assert(catalog.includes("canonical: 'https://www.customtintackers.com/products'"));
 assert.equal((catalog.match(/<SignBuyingGuide \/>/g)||[]).length,1);
 assert(!fs.readFileSync('src/components/products/SignBuyingGuide.tsx','utf8').includes('FAQPage'));
});

