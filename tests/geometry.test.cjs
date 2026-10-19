const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {allProducts}=require('../src/data/products.ts');
const {canvasForTemplate}=require('../src/lib/design/template-layout.ts');
const {fitTemplate,createDocument,parseDocument}=require('../src/lib/design/document.ts');
const {generateTemplateSVG,templateMetrics}=require('../src/lib/design/generate-template.ts');
const {generateTemplatePDF}=require('../src/lib/design/generate-template-pdf.ts');
const {PDFDocument}=require('pdf-lib');
const sharp=require('sharp');

test('custom database layouts retain metadata dimensions and editable groups without requiring a style',()=>{
  const canvas={version:'6.0.0',objects:[{type:'Group',left:144,top:72,objects:[{type:'Textbox',text:'Synthetic custom',fontSize:24},{type:'Path',path:[['M',0,0],['L',20,20]]}]},{type:'Image',src:'data:image/png;base64,iVBORw0KGgo=',left:30,top:40,width:12,height:12}]};
  const record={shape:'rectangle',width:24,height:12,canvasJson:JSON.stringify(canvas)};
  const prepared=canvasForTemplate(record,'rectangle',12,12);
  assert.equal(prepared.width,1728);assert.equal(prepared.height,864);assert.deepEqual(prepared.objects,canvas.objects);
  assert.deepEqual(fitTemplate(prepared.width,prepared.height,864,864),{scale:.5,left:0,top:216});
  const product={id:'synthetic-custom',shape:'rectangle',width:12,height:12};
  assert.deepEqual(parseDocument(JSON.stringify(createDocument(product,prepared)),product).canvas,prepared);
  assert.throws(()=>canvasForTemplate(record,'square',12,12),/shape/);
  assert.throws(()=>canvasForTemplate({...record,width:0},'rectangle',12,12),/size/);
  assert.throws(()=>canvasForTemplate({...record,canvasJson:'null'},'rectangle',12,12));
  assert.throws(()=>canvasForTemplate({...record,canvasJson:JSON.stringify({objects:[{type:'script'}]})},'rectangle',12,12));
  const explicit=canvasForTemplate({...record,canvasJson:JSON.stringify({...canvas,width:720,height:360})},'rectangle',12,12);
  assert.equal(explicit.width,720);assert.equal(explicit.height,360);
});

test('all 117 dimensioned products have coherent SVG/PDF physical page sizes, bleed and safe inset',async()=>{
  const known=allProducts.filter(p=>p.dimensions.width>0&&p.dimensions.height>0);assert.equal(known.length,117);
  for(const p of known){
    const {width,height,displaySize}=p.dimensions;
    const m=templateMetrics(width,height);
    assert.equal(m.bleedPx,9);assert.equal(m.safePx,18);
    assert.equal(m.canvasW,m.trimW+18);assert.equal(m.canvasH,m.trimH+18);
    assert.ok(Math.abs(m.trimW-width*72)<=.5);assert.ok(Math.abs(m.trimH-height*72)<=.5);
    const options={shape:p.shape,widthInches:width,heightInches:height,displaySize,productId:p.id};
    const svg=generateTemplateSVG(options);assert.doesNotMatch(svg,/NaN|Infinity/);
    assert.match(svg,/confirm final cut and mounting holes/);
    if(p.shape==='die-cut')assert.match(svg,/maximum artwork area, not the cut line/);
    const doc=await PDFDocument.load(await generateTemplatePDF(options));
    assert.equal(doc.getPageCount(),1);assert.deepEqual(doc.getPage(0).getSize(),{width:m.canvasW,height:m.canvasH});
  }
  for(const bad of [0,-1,NaN,Infinity])assert.throws(()=>templateMetrics(bad,12));
});

test('each shape family yields expected 300-DPI raster dimensions without asserting production cut geometry',async()=>{
  const known=allProducts.filter(p=>p.dimensions.width>0&&p.dimensions.height>0).sort((a,b)=>a.dimensions.width*a.dimensions.height-b.dimensions.width*b.dimensions.height);
  const samples=[...new Map(known.map(p=>[p.shape,known.find(q=>q.shape===p.shape)])).values()];assert.equal(samples.length,10);
  for(const p of samples){
    const options={shape:p.shape,widthInches:p.dimensions.width,heightInches:p.dimensions.height,displaySize:p.dimensions.displaySize,productId:p.id};
    const metadata=await sharp(Buffer.from(generateTemplateSVG(options)),{density:300}).metadata();const m=templateMetrics(p.dimensions.width,p.dimensions.height);
    assert.ok(Math.abs(metadata.width-m.canvasW*300/72)<=1,p.id);assert.ok(Math.abs(metadata.height-m.canvasH*300/72)<=1,p.id);
  }
  // Existing downloadable guides are retained reference assets, not approved dies.
  assert.equal(fs.readdirSync('public/templates').filter(f=>f.endsWith('.svg')).length,115);
});
