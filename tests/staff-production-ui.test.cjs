const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(relative,stubs={}){
 const filename=path.resolve(__dirname,relative),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));
 const original=Module._load;Module._load=function(k,p,a){return Object.prototype.hasOwnProperty.call(stubs,k)?stubs[k]:original.call(this,k,p,a);};
 try{m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);return m.exports;}finally{Module._load=original;}
}
const invoice={id:'00000000-0000-4000-8000-000000000001',customerName:'Synthetic',customerEmail:'test@example.invalid',details:{shippingAddress:'Synthetic fixture',city:'Test',state:'IL',zip:'00000',shippingCountry:'US',shippingAddressType:'commercial'},estimate:{subtotal:10000},sources:[]};
function fixture({admin=true,gateError=null}={}){
 const calls=[],props=[];
 const Page=load('../src/app/admin/invoice-requests/[id]/page.tsx',{
  '@/lib/admin-auth':{isAdminAuthenticated:async()=>{calls.push('auth');return admin;}},
  '@/lib/persistence/staff-invoice':{staffInvoice:async id=>{calls.push('invoice');assert.equal(id,invoice.id);return invoice;}},
  '@/lib/persistence/payments':{paymentReviewGate:async()=>{calls.push('gate');if(gateError)throw gateError;}},
  'next/navigation':{redirect:location=>{throw Error('redirect:'+location);}},
  './PaymentReview':function Review(input){props.push(input);return React.createElement('div',{'data-review-mode':input.testMode?'test':'live'},'Guarded payment review');},
 }).default;
 return {calls,props,render:async()=>renderToStaticMarkup(await Page({params:Promise.resolve({id:invoice.id})}))};
}
function environment(value){const old=process.env.VERCEL_ENV;process.env.VERCEL_ENV=value;return ()=>{if(old===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=old;};}
test('production staff page exposes final-price and proof controls only after existing runtime gate passes',async()=>{
 const restore=environment('production'),f=fixture();try{const html=await f.render();assert.deepEqual(f.calls,['auth','invoice','gate']);assert.match(html,/data-review-mode="live"/);assert.equal(f.props[0].testMode,false);assert.equal(f.props[0].invoiceId,invoice.id);assert.equal(f.props[0].subtotal,10000);}finally{restore();}
});
test('failed production configuration or schema check hides payment controls without leaking the error',async()=>{
 const restore=environment('production'),f=fixture({gateError:Error('synthetic-secret-must-not-render')});try{const html=await f.render();assert.deepEqual(f.calls,['auth','invoice','gate']);assert.equal(f.props.length,0);assert.match(html,/Payment review is unavailable/);assert.doesNotMatch(html,/synthetic-secret|data-review-mode/);}finally{restore();}
});
test('anonymous staff page redirects before invoice or payment schema reads',async()=>{
 const f=fixture({admin:false});await assert.rejects(f.render(),/redirect:\/admin\/login/);assert.deepEqual(f.calls,['auth']);
});
test('preview keeps explicit test labeling and the existing review gate',async()=>{
 const restore=environment('preview'),f=fixture();try{const html=await f.render();assert.match(html,/data-review-mode="test"/);assert.equal(f.props[0].testMode,true);assert.deepEqual(f.calls,['auth','invoice','gate']);}finally{restore();}
});
test('expired or disabled preview gate cannot show payment controls',async()=>{
 const restore=environment('preview'),f=fixture({gateError:Error('Test payment window expired.')});try{const html=await f.render();assert.match(html,/Payment review is unavailable/);assert.equal(f.props.length,0);}finally{restore();}
});
test('live staff controls are not mislabeled test mode, while preview remains labeled',()=>{
 const Review=load('../src/app/admin/invoice-requests/[id]/PaymentReview.tsx').default;
 const props={invoiceId:invoice.id,sources:[],subtotal:10000};
 assert.doesNotMatch(renderToStaticMarkup(React.createElement(Review,{...props,testMode:false})),/test mode/);
 assert.match(renderToStaticMarkup(React.createElement(Review,{...props,testMode:true})),/test mode/);
});
test('Orders goes to the actual protected request queue instead of demo orders',async()=>{
 let admin=false;
 const Page=load('../src/app/admin/orders/page.tsx',{'@/lib/admin-auth':{isAdminAuthenticated:async()=>admin},'next/navigation':{redirect:location=>{throw Error('redirect:'+location);}}}).default;
 await assert.rejects(Page(),/redirect:\/admin\/login/);admin=true;await assert.rejects(Page(),/redirect:\/admin\/invoice-requests/);
 const source=fs.readFileSync(path.resolve(__dirname,'../src/app/admin/orders/page.tsx'),'utf8');assert.doesNotMatch(source,/mockOrders|ORD-001|Coming Soon/);
});
