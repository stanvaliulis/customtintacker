const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const {checkoutPaused}=require('../src/lib/commerce/checkout-pause.ts');
test('production checkout defaults paused; preview keeps its existing explicit gate',()=>{
 assert.equal(checkoutPaused({VERCEL_ENV:'production'}),true);
 assert.equal(checkoutPaused({VERCEL_ENV:'production',TIN_CHECKOUT_PAUSED:'0'}),false);
 assert.equal(checkoutPaused({VERCEL_ENV:'preview'}),false);
 assert.equal(checkoutPaused({VERCEL_ENV:'preview',TIN_CHECKOUT_PAUSED:'1'}),true);
});
test('paused new and reusable sessions cannot access checkout providers; signed callbacks still recover and replay',async()=>{
 const before={...process.env};let checkoutAccess=0,verified=0,committed=0;const events=new Set();
 Object.assign(process.env,{VERCEL_ENV:'production',TIN_CHECKOUT_PAUSED:'1',TIN_ISOLATED_PREVIEW:'0'});
 const stubs={'server-only':{},'../commerce/live-payment-config':{livePaymentConfig:()=>({live:true,signingSecret:'fixture'})},'../db':{prisma:{$queryRawUnsafe:async sql=>sql.includes('launch_identity')?[{contract:'staff-reviewed-manual-v1'}]:[{marker:null}]}},'./server':{productionContext:async()=>{checkoutAccess++;throw Error('Checkout accessed');}},'../commerce/stripe-events':{stripeEventVerifier:()=>async(body,sig)=>{assert.equal(sig,'signed-fixture');verified++;return {id:body};}},'../commerce/payment-postgres':{paymentPostgres:()=>({repository:{commitPaid:async e=>{if(!events.has(e.id)){events.add(e.id);committed++;}}}})}};
 const filename=path.resolve(__dirname,'../src/lib/persistence/payments.ts'),original=Module._load;
 Module._load=function(id,p,m){if(p?.filename===filename&&id!=='../commerce/checkout-pause')return stubs[id]||{};return original.call(this,id,p,m);};
 let actions;try{const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);actions=m.exports.paymentActions;}finally{Module._load=original;}
 try{
  for(const id of ['synthetic-new','synthetic-existing-session'])await assert.rejects(actions.checkout(id),e=>e.status===503);
  assert.equal(checkoutAccess,0);
  assert.deepEqual(await actions.webhook('evt_fixture','signed-fixture'),{received:true});
  await actions.webhook('evt_fixture','signed-fixture');assert.equal(verified,2);assert.equal(committed,1);
 }finally{for(const k of Object.keys(process.env))if(!(k in before))delete process.env[k];Object.assign(process.env,before);}
});
