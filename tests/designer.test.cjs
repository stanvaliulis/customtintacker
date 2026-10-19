const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { designTemplates } = require('../src/data/design-templates.ts');
const { allProducts, products } = require('../src/data/products.ts');
const { buildTemplateCanvas } = require('../src/lib/design/template-layout.ts');
const { DesignHistory } = require('../src/lib/design/history.ts');
const { createDocument, parseDocument, fitTemplate, validateCanvas } = require('../src/lib/design/document.ts');
const { publicTiers, lowestTier, shapePriceProduct } = require('../src/lib/catalog-pricing.ts');
const { getProductSchema } = require('../src/lib/structured-data.ts');
const { generateTemplateSVG, templateMetrics } = require('../src/lib/design/generate-template.ts');
const { generateTemplatePDF } = require('../src/lib/design/generate-template-pdf.ts');
const { getShapeDefinition } = require('../src/lib/design/shapes.ts');

test('all eleven original design IDs remain available', () => {
  assert.deepEqual(designTemplates.map(t=>t.id).sort(), ['classic-brewery','happy-hour','simple-brand','craft-beer','directional','tap-room','dispensary','restaurant','street-sign','can-shape','license-plate'].map(id=>'tpl-'+id).sort());
  assert.equal(new Set(designTemplates.map(t=>t.id)).size, 11);
});
for (const template of designTemplates) {
  test(template.name + ': every matching listed product gets valid editable artwork', () => {
    const targets = products.filter(p=>p.shape===template.shape);
    assert.ok(targets.length);
    for (const p of targets) {
      const canvas=buildTemplateCanvas(p.shape,p.dimensions.width,p.dimensions.height,template.style);
      validateCanvas(canvas);
      assert.equal(canvas.width,p.dimensions.width*72);
      assert.equal(canvas.height,p.dimensions.height*72);
      const texts=canvas.objects.filter(o=>o.type==='Textbox');
      assert.ok(texts.length>=3);
      for(const o of texts) {
        assert.ok(o.fontSize>0 && o.editable);
        assert.ok(o.left-o.width/2>=18, p.id+' text left inset');
        assert.ok(o.left+o.width/2<=canvas.width-18, p.id+' text right inset');
        const textH=String(o.text).split('\n').length*o.fontSize*1.12;
        assert.ok(o.top-textH/2>=18,p.id+' text top inset');
        assert.ok(o.top+textH/2<=canvas.height-18,p.id+' text bottom inset');
      }
    }
  });
}
test('history first undo removes the last change, redo restores, new edits discard redo', () => {
  const history=new DesignHistory(3);
  history.reset('blank'); history.push('text'); history.push('image');
  assert.equal(history.peek(-1),'text'); history.move(-1);
  assert.equal(history.current,'text'); assert.equal(history.peek(1),'image');
  history.move(1); assert.equal(history.current,'image');
  history.move(-1); history.push('color'); assert.equal(history.canRedo,false);
  assert.equal(history.push('color'),false);
  history.push('position'); history.push('size');
  history.move(-1); history.move(-1); assert.equal(history.canUndo,false);
});
test('template fitting centers without stretching', () => {
  assert.deepEqual(fitTemplate(200,100,100,100),{scale:.5,left:0,top:25});
  assert.throws(()=>fitTemplate(0,1,100,100));
});
test('all arrow text, including supporting lines, stays inside the actual silhouette', () => {
  const template=designTemplates.find(t=>t.shape==='arrow');
  for(const p of products.filter(p=>p.shape==='arrow')) {
    const c=buildTemplateCanvas(p.shape,p.dimensions.width,p.dimensions.height,template.style);
    const vertices=[...getShapeDefinition('arrow').getPath(c.width,c.height).matchAll(/[ML]\s*([\d.]+),([\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
    assert.equal(vertices.length,6);
    const inside=(x,y)=>{let result=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) {const [xi,yi]=vertices[i],[xj,yj]=vertices[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi) result=!result;}return result;};
    for(const o of c.objects.filter(o=>o.type==='Textbox')) {
      const halfH=o.fontSize*1.12/2;
      for(const x of [o.left-o.width/2,o.left+o.width/2]) for(const y of [o.top-halfH,o.top+halfH]) assert.ok(inside(x,y),p.id+': '+o.text);
    }
  }
});
const product={id:'example',shape:'square',width:12,height:12};
test('editable design round-trip includes embedded image, blank canvas, and legacy migration', () => {
  for(const objects of [[],[{type:'image',src:'data:image/png;base64,aGVsbG8=',width:10,height:10}],[{type:'textbox',text:'Custom words',fontSize:28}]]) {
    const doc=createDocument(product,{objects});
    assert.deepEqual(parseDocument(JSON.stringify(doc),product),doc);
    assert.deepEqual(parseDocument(JSON.stringify({version:'6.9.1',objects}),product).canvas.objects,objects);
  }
});
test('malformed, oversized, mismatched and unsafe image drafts are rejected before replacing the canvas', () => {
  assert.throws(()=>parseDocument('{',product));
  assert.throws(()=>parseDocument('x'.repeat(9*1024*1024),product));
  assert.throws(()=>parseDocument(JSON.stringify(createDocument({...product,width:18},{objects:[]})),product));
  assert.throws(()=>validateCanvas({objects:[{type:'image',src:'file:///private.png'}]}));
  assert.throws(()=>validateCanvas({objects:[{type:'rect',width:Infinity}]}));
  assert.throws(()=>validateCanvas({objects:[{type:'unsupported'}]}));
});
test('headline price equals a visible tier, with no change to catalog values', () => {
  const p=products.find(p=>p.id==='18-inch-square-tacker');
  assert.equal(lowestTier(p.pricingTiers).pricePerUnit,2737);
  const visible=lowestTier(publicTiers(p.pricingTiers));
  assert.equal(visible.pricePerUnit,2803); assert.equal(visible.minQuantity,1000);
  assert.equal(p.minimumOrder,50);
});
test('all homepage priced shape links use the same aluminum product as their price', () => {
  for(const shape of ['square','circle','rectangle','bottle-cap','can','license-plate','die-cut']) {
    const p=shapePriceProduct(products,shape);
    assert.ok(p && p.metadata.material.includes('Aluminum'));
    assert.ok(lowestTier(publicTiers(p.pricingTiers)));
  }
});
test('all public product schemas have finite visible offers or omit offers for quotes', () => {
  for(const p of products) {
    const schema=getProductSchema(p), tiers=publicTiers(p.pricingTiers);
    if(!tiers.length) assert.equal(schema.offers,undefined);
    else {
      assert.equal(Number(schema.offers.lowPrice),lowestTier(tiers).pricePerUnit/100);
      assert.equal(schema.offers.offerCount,tiers.length);
      assert.ok(schema.offers.offers.every(o=>Number.isFinite(Number(o.price)) && o.eligibleQuantity.minValue>0));
    }
    assert.equal(schema.material,p.metadata.material);
  }
});
test('all 115 existing artwork guides map to catalog products and regenerate with valid dimensions', async () => {
  const files=fs.readdirSync('public/templates').filter(f=>f.endsWith('-template.svg'));
  assert.equal(files.length,115);
  for(const file of files) {
    const slug=file.replace(/-template\.svg$/,'');
    const p=allProducts.find(p=>p.slug===slug || p.id===slug);
    assert.ok(p, file+' catalog mapping');
    const options={shape:p.shape,widthInches:p.dimensions.width,heightInches:p.dimensions.height,displaySize:p.dimensions.displaySize,productId:p.id};
    const svg=generateTemplateSVG(options), m=templateMetrics(p.dimensions.width,p.dimensions.height);
    assert.ok(svg.includes(`viewBox="0 0 ${m.canvasW} ${m.canvasH}"`),file);
    assert.ok(!/NaN|Infinity/.test(svg),file);
    const pdf=await generateTemplatePDF(options);
    assert.equal(Buffer.from(pdf).subarray(0,4).toString(),'%PDF');
  }
});
