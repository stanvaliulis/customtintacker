const {test}=require('node:test'),assert=require('node:assert/strict');
const {manualHandoff}=require('../src/lib/commerce/manual-handoff.ts');
const {reusableCheckout}=require('../src/lib/commerce/checkout-reuse.ts');
const {livePaymentConfig}=require('../src/lib/commerce/live-payment-config.ts');
const {firstLaunchReadiness}=require('../src/lib/commerce/launch-readiness.ts');
const {reviewedStripe}=require('../src/lib/commerce/stripe-reviewed.ts');
const order={id:'synthetic',ownerId:'owner',requestHash:'a'.repeat(64),business:'IG',paid:true,currency:'usd',total:12000,subtotal:10800,setup:0,rush:0,shipping:500,tax:700,paymentTiming:'proof-approved',customerName:'Synthetic',customerEmail:'test@example.invalid',details:{notes:'Test only'},sessionId:'cs_test_synthetic',checkoutUrl:'https://checkout.stripe.com/c/pay/synthetic',items:[{productId:'product',quantity:50,backingId:'none',design:{approved:true,preference:'yes',print:{id:'proof:print'},emboss:{id:'proof:emboss'}}}]};
test('manual staff packet is read-only and requires paid approved paired proofs',()=>{const p=manualHandoff(order);assert.equal(p.productionReleased,false);assert.equal(p.lines[0].embossProof,'proof:emboss');assert.equal(p.instructions.length,3);assert.throws(()=>manualHandoff({...order,paid:false}));assert.throws(()=>manualHandoff({...order,items:[{...order.items[0],design:{...order.items[0].design,emboss:null}}]}));});
function client(diff={}){return {accounts:{retrieve:async()=>({id:'acct_IG'})},checkout:{sessions:{retrieve:async()=>({id:order.sessionId,livemode:false,status:'open',payment_status:'unpaid',expires_at:Math.floor(Date.now()/1000)+600,url:order.checkoutUrl,amount_total:order.total,currency:'usd',metadata:{orderId:order.id,reviewHash:order.requestHash,business:'IG',paymentContract:'reviewed-final-v1'},...diff})}}};}
test('existing open checkout reuses same verified session without create/payment',async()=>assert.deepEqual(await reusableCheckout(client(),order,'acct_IG'),{url:order.checkoutUrl}));
test('expired and completed checkout never creates a replacement or requests another payment',async()=>{await assert.rejects(reusableCheckout(client({status:'expired'}),order,'acct_IG'),/expired/);await assert.rejects(reusableCheckout(client({status:'complete',payment_status:'paid'}),order,'acct_IG'),/do not pay again/);await assert.rejects(reusableCheckout(client({expires_at:1}),order,'acct_IG'),/expired/);});
test('reused checkout validates account mode amount and approved review',async()=>{await assert.rejects(reusableCheckout(client(),order,'wrong'));for(const diff of [{livemode:true},{amount_total:1},{metadata:{}},{url:'https://evil.invalid'}])await assert.rejects(reusableCheckout(client(diff),order,'acct_IG'));});
const env={VERCEL_ENV:'production',TIN_REVIEWED_LIVE_ENABLED:'1',TIN_MANUAL_FULFILLMENT:'1',TIN_STRIPE_LIVE_SECRET_KEY:'rk_live_synthetic_fixture_only',TIN_STRIPE_LIVE_WEBHOOK_SECRET:'whsec_synthetic_fixture_only',TIN_STRIPE_ACCOUNT_ID:'acct_1TO24PIpmMqjUaQp',TIN_PAYMENTS_RETURN_ORIGIN:'https://www.customtintackers.com',POSTGRES_PRISMA_URL:'postgresql://synthetic@production-fixture.neon.tech/fixture',TIN_LIVE_DATABASE_HOST:'production-fixture.neon.tech'};
test('production payment configuration fails closed without explicit activation and separation',()=>{assert.throws(()=>livePaymentConfig({}));for(const changes of [{VERCEL_ENV:'preview'},{TIN_ISOLATED_PREVIEW:'1'},{TIN_REVIEWED_LIVE_ENABLED:'0'},{TIN_MANUAL_FULFILLMENT:'0'},{TIN_PRINTIQ_ENABLED:'1'},{TIN_STRIPE_LIVE_SECRET_KEY:'sk_test_fixture'},{TIN_PAYMENTS_RETURN_ORIGIN:'https://evil.invalid'},{TIN_LIVE_DATABASE_HOST:'different.neon.tech'}])assert.throws(()=>livePaymentConfig({...env,...changes}));assert.equal(livePaymentConfig(env).live,true);});
test('readiness returns blockers but never secrets or activation',()=>{const r=firstLaunchReadiness(env);assert.equal(r.paymentReady,false);assert.equal(r.emailReady,false);assert.equal(r.activationPerformed,false);assert.ok(!JSON.stringify(r).includes(env.TIN_STRIPE_LIVE_SECRET_KEY));});
test('live-mode adapter supports fixture receipts only when explicitly selected and rejects test receipts',async()=>{const now=Date.now(),o={...order,paid:false};const fake={accounts:{retrieve:async()=>({id:'acct_IG'})},checkout:{sessions:{create:async p=>({id:'cs_live_fixture',livemode:true,url:'https://checkout.stripe.com/c/pay/fixture',amount_total:o.total,currency:'usd',metadata:p.metadata})}}};await reviewedStripe(fake,{accountId:'acct_IG',returnOrigin:'https://www.customtintackers.com',live:true,now:()=>now}).create(o,o.requestHash,'invoice',now);await assert.rejects(reviewedStripe(fake,{accountId:'acct_IG',returnOrigin:'https://www.customtintackers.com',now:()=>now}).create(o,o.requestHash,'invoice',now));});
const {transactionalRepository}=require('../src/lib/commerce/repository.ts');
test('reviewed reconciliation rejects missing and stale acknowledgment before any writes; replay stays idempotent',async()=>{
 let receipt=null,paid=false,writes=0,ack=false;
 const event={id:'evt_synthetic',type:'checkout.session.completed',paymentStatus:'paid',orderId:order.id,sessionId:order.sessionId,paymentIntentId:'pi_synthetic',currency:'usd',total:order.total,shipping:500,tax:700,reviewHash:order.requestHash};
 const tx={event:async()=>receipt,byId:async()=>({...order,paid}),byPayment:async()=>null,authorizeReviewedPayment:async()=>{if(!ack)throw Error('Missing or stale acknowledgment');},insertEvent:async(id,h)=>{writes++;receipt=h;},update:async()=>{writes++;paid=true;},enqueueOnce:async()=>{writes++;}};
 const repo=transactionalRepository({transaction:async work=>work(tx)});
 await assert.rejects(repo.commitPaid({...event,reviewHash:undefined}),/binding/);assert.equal(writes,0);
 await assert.rejects(repo.commitPaid(event),/acknowledgment/);assert.equal(writes,0);
 await assert.rejects(repo.commitPaid({...event,reviewHash:'b'.repeat(64)}),/mismatch/);assert.equal(writes,0);
 ack=true;assert.equal(await repo.commitPaid(event),'applied');assert.equal(writes,3);
 ack=false;assert.equal(await repo.commitPaid(event),'duplicate');assert.equal(writes,3);
});

test('readiness cannot report payment-ready when runtime database binding fails',()=>{
 const ready={...env,TIN_CHECKOUT_PAUSED:'0',TIN_PRODUCTION_PAYMENT_SCHEMA_VERIFIED:'1'};
 assert.equal(firstLaunchReadiness(ready).paymentReady,true);
 for(const changes of [{TIN_LIVE_DATABASE_HOST:undefined},{TIN_LIVE_DATABASE_HOST:'wrong.neon.tech'},{POSTGRES_PRISMA_URL:'invalid'},{TIN_STRIPE_LIVE_WEBHOOK_SECRET:'whsec_short'}]){
  const values={...ready,...changes},r=firstLaunchReadiness(values);
  assert.equal(r.paymentReady,false);
  assert.ok(!JSON.stringify(r).includes(ready.TIN_STRIPE_LIVE_SECRET_KEY));
  assert.ok(!JSON.stringify(r).includes(ready.POSTGRES_PRISMA_URL));
 }
});
