'use strict';
const {transactionalRepository}=require('../src/lib/commerce/repository.ts');
// Synthetic transactional storage only; production algorithm is imported above.
function fixtureRepository(){
 let state={orders:new Map(),keys:new Map(),events:new Map(),outbox:new Map()};
 let failAttach=false,failCommit=false,tail=Promise.resolve();
 const transaction=work=>{const run=tail.then(async()=>{const next=structuredClone(state),clone=x=>x?structuredClone(x):null;const tx={
 byRequest:async(owner,key)=>clone(next.orders.get(next.keys.get(owner+':'+key))),
 byId:async id=>clone(next.orders.get(id)),
 bySession:async id=>clone([...next.orders.values()].find(o=>o.sessionId===id)),
 byPayment:async id=>clone([...next.orders.values()].find(o=>o.paymentId===id)),
 insert:async(key,o)=>{next.keys.set(o.ownerId+':'+key,o.id);next.orders.set(o.id,clone(o));},
 update:async o=>{if(failAttach&&o.sessionId&&!o.paid)throw Error('Synthetic session persistence fault');next.orders.set(o.id,clone(o));},
 event:async id=>next.events.get(id)||null,
 insertEvent:async(id,h)=>next.events.set(id,h),
 enqueueOnce:async(key,order)=>{if(failCommit)throw Error('Synthetic outbox persistence fault after event and paid writes');if(!next.outbox.has(key))next.outbox.set(key,{orderId:order.id,order:structuredClone(order)});}
 };const result=await work(tx);state=next;return result;});tail=run.catch(()=>{});return run;};
 const repo=transactionalRepository({transaction});
 return {...repo,get orders(){return state.orders;},get events(){return state.events;},get outbox(){return state.outbox;},setFailAttach:v=>failAttach=v,setFailCommit:v=>failCommit=v};
}
module.exports={fixtureRepository};
