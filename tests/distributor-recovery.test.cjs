const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
const recovery=require('../src/lib/distributor-recovery.ts'),http=require('../src/lib/distributor-recovery-http.ts');
const {distributorRecoveryEmail}=require('../src/lib/distributor-recovery-email.ts');
const {prepareRecoveryMigration}=require('../src/lib/distributor-recovery-migration.ts');
function compile(relative,stubs){const filename=path.resolve(__dirname,'../src',relative),original=Module._load,m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));Module._load=function(id,parent,isMain){return stubs[id]||original.call(this,id,parent,isMain);};m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return {exports:m.exports,restore:()=>Module._load=original};}
const req=(data,origin='https://example.invalid')=>new Request('https://example.invalid/api/distributor-password/request',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
test('recovery submission rejects cross origin, oversized bodies and invalid passwords',async()=>{
 assert.equal(http.validRecoveryOrigin(req({},'https://evil.invalid')),false);assert.equal(http.validRecoveryOrigin(req({})),true);
 await assert.rejects(http.recoveryBody(req({password:'x'.repeat(5000)})));await assert.rejects(http.recoveryBody(req([])));
 for(const p of ['short',' spaced passphrase ','x'.repeat(73),'界'.repeat(25),'界'.repeat(4)])assert.equal(recovery.validateNewPassword(p),false);
 assert.equal(recovery.validateNewPassword('a long unique passphrase'),true);assert.equal(recovery.validateNewPassword('界'.repeat(12)),true);
});
test('recovery email only accepts canonical fragment token links, with no password content',()=>{
 const token='a'.repeat(43),url='https://www.customtintackers.com/wholesale/password/set#token='+token;
 const email=distributorRecoveryEmail(url);assert.match(email.text,/30 minutes/);assert.match(email.text,/used once/);assert.ok(email.html.includes('Set my password'));assert.ok(!email.text.includes('Temporary password'));
 for(const bad of [url.replace('www.customtintackers.com','evil.invalid'),url.replace('#token=','?token='),url.replace('/set','/login'),url+'<script>'])assert.throws(()=>distributorRecoveryEmail(bad));
 assert.notEqual(recovery.tokenDigest(token),token);
});
test('request route gives identical response for known, unknown, throttled and failed storage; no GET action',async()=>{
 let mode='known',calls=0;const c=compile('app/api/distributor-password/request/route.ts',{
 '@/lib/distributor-recovery':{...recovery,distributorRecoveryEnabled:()=>true,createDistributorRecovery:()=>({request:async()=>{calls++;if(mode==='failed')throw Error('secret-test');return recovery.RECOVERY_MESSAGE;}})},
 '@/lib/distributor-recovery-http':http,'@/lib/db':{prisma:{}}
 });
 try{let expected;for(mode of ['known','unknown','throttled','failed']){const r=await c.exports.POST(req({email:'test@example.invalid'}));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const body=await r.text();expected??=body;assert.equal(body,expected);assert.ok(!body.includes('secret-test'));}assert.equal(calls,4);assert.equal(c.exports.GET,undefined);assert.equal((await c.exports.POST(req({},'https://evil.invalid'))).status,403);}finally{c.restore();}
});
test('completion route never exposes supplied token/password or creates a session',async()=>{
 let accepted=false;const c=compile('app/api/distributor-password/complete/route.ts',{
 '@/lib/distributor-recovery':{...recovery,distributorRecoveryEnabled:()=>true,createDistributorRecovery:()=>({complete:async()=>accepted})},'@/lib/distributor-recovery-http':http,'@/lib/db':{prisma:{}}
 });try{const r=await c.exports.POST(req({token:'SECRET-TOKEN',password:'SECRET-PASSWORD'}));assert.equal(r.status,400);const body=await r.text();assert.ok(!body.includes('SECRET'));accepted=true;const ok=await c.exports.POST(req({}));assert.equal(ok.status,200);assert.equal(ok.headers.has('set-cookie'),false);assert.equal(c.exports.GET,undefined);}finally{c.restore();}
});
test('worker refuses missing bearer and disabled mail before transport or DB',async()=>{
 const previous=process.env.CRON_SECRET;process.env.CRON_SECRET='x'.repeat(32);let dbCalls=0;
 const c=compile('app/api/internal/distributor-recovery-worker/route.ts',{
 '@/lib/distributor-recovery':{...recovery,distributorRecoveryEnabled:()=>false,createDistributorRecovery:()=>{dbCalls++;throw Error('must not run');}},
 '@/lib/distributor-recovery-email':{distributorRecoveryEmail},'@/lib/email':{canSendSensitiveEmail:()=>true,sendEmailTo:()=>{throw Error('no mail');}},'@/lib/distributor-recovery-http':http
 });try{assert.equal((await c.exports.POST(req({}))).status,401);assert.equal((await c.exports.POST(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer '+'x'.repeat(32)}}))).status,503);assert.equal(dbCalls,0);assert.equal(c.exports.GET,c.exports.POST);}finally{c.restore();if(previous===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=previous;}
});
test('migration requires explicit duplicate business reconciliation and complete coverage',async()=>{
 const a={id:'a',email:'business@example.invalid',companyName:'Business',contactName:'Person',website:'old',asiNumber:'',sageNumber:'',ppaiNumber:'',status:'approved'},b={...a,id:'b',website:'new'};
 const mapping={email:a.email,primaryId:'b',applicationIds:['a','b'],acceptedDifferingFields:[]};
 await assert.rejects(prepareRecoveryMigration([], [a,b],[mapping]));mapping.acceptedDifferingFields=['website'];
 const plan=await prepareRecoveryMigration([],[a,b],[mapping]);assert.equal(plan.accounts.length,1);assert.equal(plan.accounts[0].passwordHash,null);assert.equal(plan.accounts[0].status,'setup_required');assert.equal(plan.accounts[0].applicationIds.length,2);
 await assert.rejects(prepareRecoveryMigration([],[a,{...b,companyName:'Different business'}],[mapping]));
 await assert.rejects(prepareRecoveryMigration([],[a,b],[{...mapping,applicationIds:['a'],primaryId:'a'}]));
});
test('JWT callback invalidates missing, stale and disabled durable sessions, fails closed on DB error',async()=>{
 let config,current=true,fail=false;const c=compile('lib/auth.ts',{
 'next-auth':{__esModule:true,default:opts=>{config=opts;return {};}},'next-auth/providers/credentials':{__esModule:true,default:x=>x},
 './distributor-accounts':{durableDistributorAccountsEnabled:()=>true,authenticateDurableDistributor:async()=>null,isDistributorSessionCurrent:async(_email,v)=>{if(fail)throw Error('db failure');return current&&v===2;}},
 '@/lib/distributors':{parseEnvCredentials:()=>[],findDistributorByEmail:()=>undefined}
 });try{for(const version of [undefined,1])assert.equal(await config.callbacks.jwt({token:{email:'test@example.invalid',accountVersion:version}}),null);assert.ok(await config.callbacks.jwt({token:{email:'test@example.invalid',accountVersion:2}}));current=false;assert.equal(await config.callbacks.jwt({token:{email:'test@example.invalid',accountVersion:2}}),null);fail=true;assert.equal(await config.callbacks.jwt({token:{email:'test@example.invalid',accountVersion:2}}),null);}finally{c.restore();}
});
