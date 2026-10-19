const {test}=require('node:test'),assert=require('node:assert/strict');
const {createAdminToken,verifyAdminToken}=require('../src/lib/admin-session.ts');
test('administrator cookie requires secret-backed signature, purpose and expiry',async()=>{
 const secret='synthetic-admin-signing-secret-000000000',now=1000000,a=await createAdminToken(secret,now),b=await createAdminToken(secret,now);assert.notEqual(a,b);assert.equal(await verifyAdminToken(a,secret,now),true);assert.equal(await verifyAdminToken(a,secret+'x',now),false);assert.equal(await verifyAdminToken(a+'x',secret,now),false);assert.equal(await verifyAdminToken(a,secret,now+86400001),false);assert.equal(await verifyAdminToken('legacy-static-marker',secret,now),false);assert.equal(await verifyAdminToken(a,'',now),false);await assert.rejects(createAdminToken('short'));
});
