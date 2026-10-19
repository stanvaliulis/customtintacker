const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepareLegacyDistributorAccounts}=require('../src/lib/distributor-migration.ts');
const {verifyDistributorPassword}=require('../src/lib/distributor-password.ts');
test('legacy migration preserves old password compatibility without logging or mutating records',async()=>{
 const rows=[{email:'Old@example.invalid',password:'old',companyName:'Synthetic',status:'approved',discountTier:0.23}];
 const original=JSON.stringify(rows),prepared=await prepareLegacyDistributorAccounts(rows);
 assert.equal(JSON.stringify(rows),original);assert.equal(prepared[0].profile.discountTier,0.23);
 assert.equal(prepared[0].profile.legacySubject,'Old@example.invalid');
 assert.equal(await verifyDistributorPassword('old',prepared[0].passwordHash),true);
 assert.equal(prepared[0].password,undefined);
 await assert.rejects(prepareLegacyDistributorAccounts([...rows,{...rows[0],email:'old@example.invalid'}]));
 await assert.rejects(prepareLegacyDistributorAccounts([{...rows[0],password:'x'.repeat(73)}]));
});
