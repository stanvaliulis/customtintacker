const {test}=require('node:test'),assert=require('node:assert/strict');
const {guidedCanvas}=require('../src/lib/design/guided-review.ts');
const {savedAttachment,sourceFromRecord,sourceVersion,attachmentMatches}=require('../src/lib/design/proof-attachment.ts');
const {parseDocument}=require('../src/lib/design/document.ts');
const {allProducts}=require('../src/data/products.ts');
const product=allProducts.find(p=>p.id==='18-inch-square-tacker');
const packet=()=>({version:1,product:{id:product.id,shape:product.shape,...{width:18,height:18}},original:{name:'sample.svg',data:'data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25"/></svg>').toString('base64')},embossPreference:'suggested',selectedRegions:['region-0'],customerDecision:'direction-approved',notes:'Retain these notes',productionApproval:'unapproved',delivery:'local-only-not-submitted'});
const record=p=>({id:'design-guided-test',productId:product.id,shape:product.shape,width:18,height:18,canvasJson:JSON.stringify(guidedCanvas(p))});
test('guided attachments preserve originals, notes, exact product and source hashes; changed/replaced/invalid reviews reject',async()=>{
 const p=packet(),r=record(p),a=await savedAttachment(r,product.id);
 assert.equal(a.workflow,'upload');assert.equal(a.reviewStatus,'unapproved');assert.deepEqual(a.emboss.selectedIds,['region-0']);assert.equal(JSON.parse(r.canvasJson).guidedUpload.original.data,p.original.data);
 assert.throws(()=>parseDocument(JSON.stringify({version:1,product:p.product,canvas:JSON.parse(r.canvasJson)}),p.product),/Upload/);
 await assert.rejects(savedAttachment(r,'different'),/different product/);
 const changed=record({...p,notes:'Changed'});await assert.rejects(savedAttachment(changed,product.id,a.reviewVersion),/changed/);
 assert.notEqual((await savedAttachment(changed,product.id)).sourceHash,a.sourceHash);
 assert.equal(attachmentMatches({...a,sourceHash:'forged'},a),false);
 assert.throws(()=>sourceFromRecord({...r,width:12}),/match/);
 for(const change of [{productionApproval:'approved'},{customerDecision:''},{selectedRegions:['bad']},{selectedRegions:['region-0','region-0']},{original:{name:'a.svg',data:'https://example.com/a.svg'}}])assert.throws(()=>record({...p,...change}));
 assert.equal(sourceVersion(sourceFromRecord(r)),a.reviewVersion);
});
test('atomic repeated guided additions retain quantity, backing, rush and product; mismatches leave cart untouched',async()=>{
 const {cartReducer}=require('../src/context/CartContext.tsx');const a=await savedAttachment(record(packet()),product.id),action={type:'ATTACH_GUIDED',product,attachment:a};
 const state={items:[],isDistributor:false,distributorDiscount:.4};let next=cartReducer(state,action);next.items[0].quantity=500;next.items[0].isRush=true;
 for(let i=0;i<5;i++)next=cartReducer(next,action);
 assert.equal(next.items.length,1);assert.equal(next.items[0].quantity,500);assert.equal(next.items[0].isRush,true);assert.equal(next.items[0].designId,a.designId);
 assert.equal(cartReducer(next,{...action,attachment:{...a,productId:'wrong'}}),next);
 const distributor=cartReducer({...state,isDistributor:true},action);assert.equal(distributor.items[0].priceTier,'distributor');assert.ok(distributor.items[0].unitPrice>0);assert.ok(distributor.items[0].unitPrice<next.items[0].unitPrice);
});
test('actual guided UI saves/readbacks, repeats safely, rejects stale readback and reopens without approval',async()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/upload-proof'});
 Object.assign(global,{window:dom.window,self:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser,localStorage:dom.window.localStorage,File:require('node:buffer').File,IS_REACT_ACT_ENVIRONMENT:true});
 const React=require('react');global.React=React;const {act}=React,{createRoot}=require('react-dom/client');const Upload=require('../src/components/design/UploadProof.tsx').default,{CartProvider,useCart}=require('../src/context/CartContext.tsx');
 let state;function Probe(){state=useCart();return null;}let records={},posts=0;const oldFetch=global.fetch;
 global.fetch=async(url,options)=>{if(url==='/api/artwork/session')return {ok:true};if(options?.method==='POST'){const b=JSON.parse(options.body),id='design-fixture-'+(++posts);records[id]={...b,id};return {ok:true,json:async()=>({id})};}const r=records[url.split('/').pop()];return {ok:!!r,json:async()=>structuredClone(r)};};
 const render=root=>root.render(React.createElement(CartProvider,null,React.createElement(Upload,{products:[product]}),React.createElement(Probe)));
 let root=createRoot(document.getElementById('root'));await act(async()=>render(root));
 const click=async (label,wait=true)=>{await act(async()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent===label);assert.ok(b,label);b.click();});if(wait&&label==='Save review and attach to cart')for(let i=0;i<30&&[...document.querySelectorAll('button')].find(b=>b.textContent===label)?.disabled;i++)await act(async()=>new Promise(r=>setTimeout(r,10)));};
 await click('Try sample artwork');await click('Approve this direction');await click('Save review and attach to cart');
 for(let i=0;i<30&&!state.items.length;i++)await act(async()=>new Promise(r=>setTimeout(r,10)));assert.equal(state.items.length,1,document.body.textContent);assert.equal(posts,1);const id=state.items[0].designId,quantity=state.items[0].quantity;
 await click('Save review and attach to cart');assert.equal(posts,1);assert.equal(state.items[0].quantity,quantity);
 const original=records[id].canvasJson;const bad=JSON.parse(original);bad.guidedUpload.notes='replaced';records[id].canvasJson=JSON.stringify(bad);
 await click('Save review and attach to cart');for(let i=0;i<20;i++)await act(async()=>new Promise(r=>setTimeout(r,10)));assert.match(document.body.textContent,/changed since review/);assert.equal(state.items[0].proofAttachment.sourceHash,(await savedAttachment({...records[id],canvasJson:original},product.id)).sourceHash);
 records[id].canvasJson=original;await act(async()=>root.unmount());dom.reconfigure({url:'http://localhost/upload-proof?product='+product.id+'&review='+id});root=createRoot(document.getElementById('root'));await act(async()=>render(root));
 for(let i=0;i<30&&!document.querySelector('svg[aria-label="Fitted artwork review"]');i++)await act(async()=>new Promise(r=>setTimeout(r,10)));assert.ok(document.querySelector('svg[aria-label="Fitted artwork review"]'));assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent==='Save review and attach to cart').disabled,true);assert.match(document.body.textContent,/Confirm your direction again/);assert.equal(state.items[0].quantity,quantity);
 // Interrupted verification cannot attach a replaced in-memory review.
 await click('Approve this direction');let release;global.fetch=async(url,options)=>{if(url==='/api/artwork/session')return {ok:true};if(options?.method==='POST')return {ok:true,json:async()=>({id})};return new Promise(r=>release=()=>r({ok:true,json:async()=>records[id]}));};
 await click('Save review and attach to cart',false);for(let i=0;i<30&&!release;i++)await act(async()=>new Promise(r=>setTimeout(r,10)));await click('Try sample artwork');await act(async()=>release());assert.equal(state.items.length,1);assert.equal(state.items[0].quantity,quantity);assert.ok(!document.body.textContent.includes('Saved review attached to your local cart.'));
 await act(async()=>root.unmount());global.fetch=oldFetch;dom.window.close();
});

test('guided source replacement is rejected by the shared order validator before charges or external adapters',async()=>{
 const {priceOrder}=require('../src/lib/commerce/service.ts');let saved={...record(packet()),ownerId:'synthetic-owner'},charges=0;
 const d={principal:async()=>({ownerId:'synthetic-owner'}),products:async()=>[product],backings:[{id:product.backingOptions[0],priceMultiplier:1}],design:async()=>saved,policy:{business:'IG',timing:'upfront',charges:{version:'synthetic',calculate:async()=>{charges++;return {shipping:0,tax:0};}}}};
 const a=await savedAttachment(saved,product.id),body={name:'Synthetic',email:'synthetic@example.invalid',items:[{productId:product.id,quantity:product.minimumOrder,backingId:product.backingOptions[0],designId:saved.id,proofAttachment:a}]};
 const valid=await priceOrder(body,d,false);assert.equal(valid.items[0].design.approved,false);assert.equal(charges,1);
 saved={...record({...packet(),notes:'Changed after attachment'}),ownerId:'synthetic-owner'};
 await assert.rejects(priceOrder(body,d,false),e=>e.status===409&&/stale/.test(e.message));assert.equal(charges,1);
});
