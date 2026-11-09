const {test}=require('node:test'),assert=require('node:assert/strict');
const {notificationReadinessHandler}=require('../src/lib/commerce/notification-readiness.ts');
const env={VERCEL_ENV:'production',TIN_REVIEWED_LIVE_ENABLED:'1',TIN_MANUAL_FULFILLMENT:'1',TIN_STRIPE_LIVE_SECRET_KEY:'rk_live_offline_fixture',TIN_STRIPE_LIVE_WEBHOOK_SECRET:'whsec_offline_fixture',TIN_STRIPE_ACCOUNT_ID:'acct_1TO24PIpmMqjUaQp',TIN_PAYMENTS_RETURN_ORIGIN:'https://www.customtintackers.com',POSTGRES_PRISMA_URL:'postgresql://fixture@fixture.neon.tech/db',TIN_LIVE_DATABASE_HOST:'fixture.neon.tech',TIN_CHECKOUT_PAUSED:'1',TIN_INVOICE_MAIL_ENABLED:'0',TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED:'0',TIN_PAID_ORDER_MAIL_ENABLED:'0',TIN_WORKFLOW_ENABLED:'1',RESEND_FROM:'Custom Tin Tackers <notifications@customtintackers.com>',RESEND_API_KEY:'re_offline_fixture_do_not_return',CRON_SECRET:'offline_fixture_do_not_return_123456789',NOTIFICATION_EMAIL:'sales@customtintackers.com'};
const rows=()=>['invoice','paid'].map(kind=>({kind,total:'0',pending:'0',sending:'0',held:'0',delivered:'0'}));
function fixture(overrides={}){const calls=[];const deps={authenticate:async()=>{calls.push('auth');return true;},env:()=>{calls.push('env');return env;},schema:async()=>{calls.push('schema');return true;},queues:async()=>{calls.push('queues');return rows();},...overrides};return {calls,run:(query='',method='GET')=>notificationReadinessHandler(deps)(new Request('https://fixture.invalid/api/admin/notification-readiness'+query,{method}))};}
test('notification diagnostic authenticates before environment or database and rejects parameters or writes',async()=>{
 const unauthorized=fixture({authenticate:async()=>false});const response=await unauthorized.run();assert.equal(response.status,401);assert.deepEqual(unauthorized.calls,[]);assert.match(response.headers.get('cache-control'),/private.*no-store/);assert.equal(response.headers.get('vary'),'Cookie');
 for(const [query,method,status]of [['?order=anything','GET',400],['','POST',405]]){const f=fixture();assert.equal((await f.run(query,method)).status,status);assert.deepEqual(f.calls,['auth']);}
});
test('notification diagnostic returns only bounded aggregate counts and configuration booleans, never a delivery claim',async()=>{
 const f=fixture(),response=await f.run(),body=await response.json();assert.equal(response.status,200);assert.deepEqual(f.calls,['auth','env','schema','queues']);assert.equal(body.configurationChecksPass,true);assert.equal(body.queueReviewRequired,false);assert.equal(body.deliveryVerified,false);assert.equal(body.sendAttempted,false);assert.equal(body.activationPerformed,false);
 for(const [key,value]of Object.entries(body)){if(key==='queues'){for(const counts of Object.values(value))assert(Object.values(counts).every(n=>Number.isSafeInteger(n)&&n>=0));}else assert.equal(typeof value,'boolean');}
 const text=JSON.stringify(body);for(const forbidden of [env.RESEND_FROM,env.RESEND_API_KEY,env.CRON_SECRET,env.TIN_STRIPE_LIVE_SECRET_KEY,env.POSTGRES_PRISMA_URL,env.NOTIFICATION_EMAIL])assert(!text.includes(forbidden));
});
test('notification diagnostic refuses active checkout or any active/missing mail flag before SQL',async()=>{
 for(const change of [{TIN_CHECKOUT_PAUSED:'0'},{TIN_INVOICE_MAIL_ENABLED:'1'},{TIN_PAID_ORDER_MAIL_ENABLED:'1'},{TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED:'1'},{TIN_INVOICE_MAIL_ENABLED:undefined}]){
  const f=fixture({env:()=>({...env,...change})});assert.equal((await f.run()).status,409);assert(!f.calls.includes('schema'));assert(!f.calls.includes('queues'));
 }
});
test('notification diagnostic refuses preview, wrong database and automatic fulfillment before SQL',async()=>{
 for(const change of [{VERCEL_ENV:'preview'},{TIN_ISOLATED_PREVIEW:'1'},{TIN_LIVE_DATABASE_HOST:'foreign.neon.tech'},{TIN_MANUAL_FULFILLMENT:'0'},{TIN_AUTOMATIC_PRODUCTION_RELEASE:'1'}]){
  const f=fixture({env:()=>({...env,...change})});assert.equal((await f.run()).status,503);assert(!f.calls.includes('schema'));assert(!f.calls.includes('queues'));
 }
});
test('notification diagnostic reports incomplete sender/worker/workflow configuration without returning its values',async()=>{
 for(const [change,field]of [[{RESEND_FROM:'Other <private@example.invalid>'},'senderMatchesExpected'],[{RESEND_FROM:'bad\r\n@example.invalid'},'senderConfigured'],[{RESEND_API_KEY:''},'providerCredentialConfigured'],[{CRON_SECRET:'short'},'workerCredentialConfigured'],[{TIN_WORKFLOW_ENABLED:'0'},'workflowEnabled'],[{NOTIFICATION_EMAIL:'private@example.invalid'},'configuredRecipientMatches']]){
  const response=await fixture({env:()=>({...env,...change})}).run(),body=await response.json();assert.equal(response.status,200);assert.equal(body[field],false);assert.equal(body.configurationChecksPass,false);assert(!JSON.stringify(body).includes('private@example.invalid'));
 }
});
test('pending, in-flight, held and unknown queue states require review; delivered history alone does not',async()=>{
 for(const field of ['pending','sending','held','other']){const input=rows();input[0].total='1';if(field!=='other')input[0][field]='1';input[0].customer='PRIVATE_CUSTOMER';const body=await(await fixture({queues:async()=>input}).run()).json();assert.equal(body.queueReviewRequired,true);assert.equal(body.queues.invoice[field],1);assert(!JSON.stringify(body).includes('PRIVATE_CUSTOMER'));}
 const input=rows();input[1].total='3';input[1].delivered='3';const body=await(await fixture({queues:async()=>input}).run()).json();assert.equal(body.queueReviewRequired,false);assert.equal(body.queues.paid.delivered,3);
});
test('malformed, duplicated or unsafe aggregate values fail closed rather than report empty queues',async()=>{
 const cases=[[],[rows()[0],rows()[0]],null,rows().map(r=>({...r,total:'9007199254740992'})),rows().map(r=>({...r,pending:'-1'})),rows().map(r=>({...r,pending:NaN})),rows().map(r=>({...r,total:'0',pending:'1'})),rows().map(r=>({...r,total:'1e2'}))];
 for(const value of cases){const response=await fixture({queues:async()=>value}).run();assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'Read-only notification verification unavailable.'});}
});
test('schema failure prevents queue access and exceptions never expose database or provider details',async()=>{
 const f=fixture({schema:async()=>false});assert.equal((await f.run()).status,503);assert(!f.calls.includes('queues'));
 for(const target of ['schema','queues']){const response=await fixture({[target]:async()=>{throw Error(env.POSTGRES_PRISMA_URL+' '+env.RESEND_API_KEY);}}).run();assert.equal(response.status,503);assert(!(await response.text()).includes('fixture@'));}
});
test('actual notification diagnostic route performs only schema and aggregate SELECTs with no provider or write interface',async()=>{
 const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),filename=path.resolve(__dirname,'../src/app/api/admin/notification-readiness/route.ts'),original=Module._load,before={...process.env};let authenticated=false;const sqls=[];
 const stubs={'server-only':{},'@/lib/admin-auth':{isAdminAuthenticated:async()=>authenticated},'@/lib/db':{prisma:{$queryRawUnsafe:async sql=>{
  sqls.push(sql);assert.match(sql.trim(),/^SELECT /);assert.doesNotMatch(sql,/\b(INSERT|UPDATE|DELETE|MERGE|ALTER|CREATE|DROP|FOR UPDATE)\b/i);
  if(sql.includes('to_regclass'))return [{marker:null}];
  if(sql.includes('launch_identity'))return [{contract:'staff-reviewed-manual-v1',payment_version:1,workflow_version:1}];
  assert.match(sql,/count\(\*\)/);assert.match(sql,/tin_workflow\.outbox/);assert.match(sql,/tin_payments\.notification_outbox/);assert.doesNotMatch(sql,/\b(payload|snapshot|customer|owner_id|order_id|binding|provider_receipt|message_id)\b/i);return rows();
 }}},'@/lib/commerce/notification-readiness':{notificationReadinessHandler}};
 Module._load=function(id,p,m){if(p?.filename===filename&&Object.hasOwn(stubs,id))return stubs[id];return original.call(this,id,p,m);};
 let route;try{const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);route=m.exports;}finally{Module._load=original;}
 try{Object.assign(process.env,env);assert.equal(route.dynamic,'force-dynamic');assert.deepEqual(Object.keys(route).sort(),['GET','dynamic','runtime']);const request=new Request('https://fixture.invalid/api/admin/notification-readiness');assert.equal((await route.GET(request)).status,401);assert.equal(sqls.length,0);authenticated=true;assert.equal((await route.GET(request)).status,200);assert.equal(sqls.length,3);assert.equal((await route.GET(request)).status,200);assert.equal(sqls.length,6);}finally{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
});
