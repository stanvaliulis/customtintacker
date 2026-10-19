const {test}=require('node:test'),assert=require('node:assert/strict');
const {createGuestOwner,verifyGuestOwner,accountOwner,requireSameOrigin,boundedJson}=require('../src/lib/persistence/request-security.ts');
test('guest ownership is signed, expiring, purpose scoped and never a caller email or sessionId',()=>{
 const secret='synthetic-test-only-secret-value-000000000',now=1000000,a=createGuestOwner(secret,now),b=createGuestOwner(secret,now);
 assert.notEqual(a.ownerId,b.ownerId);assert.equal(verifyGuestOwner(a.token,secret,now),a.ownerId);assert.equal(verifyGuestOwner(a.token+'x',secret,now),null);assert.equal(verifyGuestOwner(a.token,secret+'x',now),null);assert.equal(verifyGuestOwner(a.token,secret,now+31*86400000),null);assert.equal(verifyGuestOwner('owner@example.invalid',secret,now),null);assert.throws(()=>createGuestOwner('short'));assert.equal(accountOwner('verified-subject'),accountOwner('verified-subject'));assert.notEqual(accountOwner('verified-subject'),accountOwner('other'));
});
test('write boundary rejects cross-origin and oversized chunked or malformed requests',async()=>{
 const r=(body,headers={})=>new Request('https://example.invalid/api/artwork/save',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.invalid',...headers},body});
 assert.doesNotThrow(()=>requireSameOrigin(r('{}')));assert.throws(()=>requireSameOrigin(r('{}',{Origin:'https://foreign.invalid'})),e=>e.status===403);assert.throws(()=>requireSameOrigin(r('{}',{'Sec-Fetch-Site':'cross-site'})),e=>e.status===403);
 assert.doesNotThrow(()=>requireSameOrigin(new Request('http://localhost:3105/api/artwork/session',{method:'POST',headers:{host:'127.0.0.1:3105',origin:'http://127.0.0.1:3105'}})));assert.throws(()=>requireSameOrigin(r('{}',{host:'example.invalid',origin:'https://other.invalid'})),e=>e.status===403);
 assert.deepEqual(await boundedJson(r('{"ok":true}')), {ok:true});await assert.rejects(boundedJson(r('x')),e=>e.status===400);await assert.rejects(boundedJson(r('"'+ 'x'.repeat(50)+'"'),10),e=>e.status===413);await assert.rejects(boundedJson(r('{}',{'Content-Length':'999'}),10),e=>e.status===413);
});
test('actual private invoice routes enforce same-origin, unpaid status and owned status lookup',async()=>{
 const f=await require('./invoice-route-fixture.cjs')();assert.equal((await f.post(f.request(f.body,undefined,'https://foreign.invalid'))).status,403);assert.equal(f.orders.size,0);
 const response=await f.post(f.request({...f.body,paid:true,total:1}));assert.equal(response.status,201);const result=await response.json();assert.equal(result.paid,false);assert.equal(result.status,'invoice-requested');assert.equal(f.jobs.size,1);
 const url='https://example.invalid/api/orders/invoice/status?order_id='+result.orderId;assert.deepEqual(await (await f.get(new Request(url))).json(),{...result,productionReleased:false});f.setOwner('other');assert.equal((await f.get(new Request(url))).status,404);
});
