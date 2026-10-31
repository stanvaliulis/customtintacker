const {test}=require('node:test'),assert=require('node:assert/strict'),Stripe=require('stripe');
const {stripeEventVerifier}=require('../src/lib/commerce/stripe-events.ts');
const {paymentHttp}=require('../src/lib/commerce/payment-http.ts');
const secret='whsec_synthetic_routing_tests_only';
const metadata={business:'IG',orderId:'synthetic-order',paymentContract:'reviewed-final-v1',reviewHash:'a'.repeat(64),shippingCents:'500',taxCents:'700'};
const event=(meta=metadata)=>({id:'evt_synthetic_routing',livemode:true,type:'checkout.session.completed',data:{object:{id:'cs_live_synthetic_fixture',mode:'payment',livemode:true,payment_status:'paid',payment_intent:'pi_synthetic_fixture',currency:'usd',amount_total:12200,amount_subtotal:12200,total_details:{amount_shipping:0,amount_tax:0,amount_discount:0},metadata:meta}}});
const verify=stripeEventVerifier({signingSecret:secret,live:true,reviewedOnly:true});
const signed=e=>{const body=JSON.stringify(e);return {body,signature:Stripe.webhooks.generateTestHeaderString({payload:body,secret})};};
const check=e=>{const s=signed(e);return verify(s.body,s.signature);};
test('signed unrelated payment link and ordinary metadata acknowledge without a Tin event on every retry',async()=>{
 for(const meta of [{},null,undefined,{externalInvoice:'synthetic'}]){const e=event(meta);if(meta===undefined)delete e.data.object.metadata;e.data.object.payment_link='plink_synthetic';for(let n=0;n<3;n++)assert.equal(await check(e),null);}
});
test('unrelated events cannot bypass signature, account, session mode or live-mode verification',async()=>{
 const e=event({}),s=signed(e);await assert.rejects(verify(s.body+' ',s.signature),/signature/);
 for(const bad of [{...e,livemode:false},{...e,account:'acct_foreign'},{...e,data:{object:{...e.data.object,livemode:false}}},{...e,data:{object:{...e.data.object,mode:'subscription'}}}])await assert.rejects(check(bad),/mismatch/);
});
test('partial conflicting malformed or unpaid malformed Tin tags never use the unrelated path',async()=>{
 for(const meta of [{business:'CP'},{business:''},{orderId:'synthetic-order'},{paymentContract:'reviewed-final-v1'},{reviewHash:'x'},{shippingCents:'0'},{taxCents:'0'},[], 'invalid',{...metadata,paymentContract:'other'},{...metadata,reviewHash:'bad'},{...metadata,taxCents:'999999'}])await assert.rejects(check(event(meta)));
 const unpaid=event({business:'IG'});unpaid.data.object.payment_status='unpaid';await assert.rejects(check(unpaid));
});
test('valid Tin approval retains exact amount bindings; unpaid valid event never marks paid',async()=>{
 const r=await check(event());assert.equal(r.orderId,'synthetic-order');assert.equal(r.total,12200);assert.equal(r.shipping,500);assert.equal(r.tax,700);assert.equal(r.reviewHash,metadata.reviewHash);
 const unpaid=event();unpaid.data.object.payment_status='unpaid';assert.equal(await check(unpaid),null);
});
test('actual payment action acknowledges unrelated retries without reconciliation and propagates Tin persistence failures',async(t)=>{
 const Module=require('node:module'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
 const filename=path.resolve(__dirname,'../src/lib/persistence/payments.ts'),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));
 let commits=0,fail=true;const stubs={'server-only':{},'../db':{prisma:{$queryRawUnsafe:async sql=>sql.includes('launch_identity')?[{contract:'staff-reviewed-manual-v1'}]:[{marker:null}]}},'../commerce/live-payment-config':{livePaymentConfig:()=>({signingSecret:secret,live:true})},'../commerce/payment-postgres':{paymentPostgres:()=>({repository:{commitPaid:async()=>{commits++;if(fail)throw Error('synthetic persistence failure');}}})},'./staff-invoice':{},'./server':{},'./postgres':{},'./vercel-private':{}};
 const original=Module._load;Module._load=function(k,...args){return stubs[k]||original.call(this,k,...args);};try{m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);}finally{Module._load=original;}
 const old={VERCEL_ENV:process.env.VERCEL_ENV,TIN_ISOLATED_PREVIEW:process.env.TIN_ISOLATED_PREVIEW};process.env.VERCEL_ENV='production';delete process.env.TIN_ISOLATED_PREVIEW;
 try{const handler=paymentHttp(m.exports.paymentActions);const send=e=>{const s=signed(e);return handler.webhookPost(new Request('https://synthetic.invalid/webhook',{method:'POST',headers:{'stripe-signature':s.signature},body:s.body}));};
 for(let n=0;n<3;n++)assert.equal((await send(event({}))).status,200);assert.equal(commits,0);
 assert.equal((await send(event({business:'IG'}))).status,400);assert.equal(commits,0);
 assert.equal((await send(event())).status,503);assert.equal(commits,1);
 fail=false;assert.equal((await send(event())).status,200);assert.equal(commits,2);
 }finally{for(const [k,v]of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
