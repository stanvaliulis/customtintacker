const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
const {NextRequest}=require('next/server');
const review=require('../src/lib/admin-review.ts');
const {distributorApplicationEmail}=require('../src/lib/email-templates.ts');
const passwords=require('../src/lib/distributor-password.ts');

test('review links identify exact applications and sanitize return destinations',()=>{
 const id='a&next=https://evil.invalid/"';
 const url=review.distributorReviewPath(id);
 assert.equal(new URL(url,'https://local.invalid').searchParams.get('application'),id);
 assert.equal(review.safeAdminReturnPath(url),url);
 for(const bad of ['//evil.invalid','https://evil.invalid','/admin/../outside','/admin\\evil','/admin/login','javascript:alert(1)']) assert.equal(review.safeAdminReturnPath(bad),'/admin');
 const email=distributorApplicationEmail({id,companyName:'Synthetic',contactName:'Test',email:'test@example.invalid',phone:''});
 assert.ok(email.text.includes('https://www.customtintackers.com'+url));
 assert.ok(email.html.includes('Review &amp; approve application'));
 assert.ok(!email.html.includes('/api/admin'));
});

test('password hashes are salted; incorrect and truncated passwords fail',async()=>{
 const password='synthetic-test-password';
 const a=await passwords.hashDistributorPassword(password), b=await passwords.hashDistributorPassword(password);
 assert.notEqual(a,b); assert.ok(!a.includes(password));
 assert.equal(await passwords.verifyDistributorPassword(password,a),true);
 assert.equal(await passwords.verifyDistributorPassword(password+'x',a),false);
 await assert.rejects(passwords.hashDistributorPassword('x'.repeat(73)));
 assert.equal(await passwords.verifyDistributorPassword('x'.repeat(73),a),false);
 assert.equal(await passwords.verifyDistributorPassword(password,password),false);
});

function compile(relative,stubs) {
 const filename=path.resolve(__dirname,'../src',relative), original=Module._load;
 const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));
 Module._load=function(id,parent,isMain){return stubs[id]||original.call(this,id,parent,isMain);};
 m._compile(output,filename);return {exports:m.exports,restore:()=>{Module._load=original;}};
}

test('actual review API rejects unauthorized, CSRF, unconfirmed and disabled approval without writes',async()=>{
 let authenticated=false,enabled=false,writes=0,mails=0,mailConfigured=true;
 const previousMailFlag=process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED;process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED='1';
 const application={id:'synthetic-id',status:'pending',email:'test@example.invalid',companyName:'Synthetic',contactName:'Test',createdAt:new Date()};
 const c=compile('app/api/admin/distributors/[id]/route.ts',{
  '@/lib/admin-auth':{isAdminAuthenticated:async()=>authenticated},
  '@/lib/admin-review':review, '@/lib/env':{isDatabaseConfigured:()=>true},
  '@/lib/db':{prisma:{distributorApplication:{findUniqueOrThrow:async()=>application}}},
  '@/lib/json-store':{readJsonFile:()=>{throw Error('Forbidden file fallback');}},
  '@/lib/distributor-accounts':{durableDistributorAccountsEnabled:()=>enabled,approveDistributorSetup:async id=>{assert.equal(id,application.id);writes++;return {...application,status:'approved'};}},
  '@/lib/distributor-recovery':{distributorRecoveryEnabled:()=>enabled},
  '@/lib/email':{canSendSensitiveEmail:()=>mailConfigured,sendEmailTo:async()=>{mails++;}},
  '@/lib/email-templates':{distributorApprovalEmail:()=>({}),distributorRejectionEmail:()=>({})}
 });
 const context={params:Promise.resolve({id:application.id})};
 const req=(body,origin='https://example.invalid')=>new NextRequest('https://example.invalid/api/admin/distributors/synthetic-id',{method:'PATCH',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await c.exports.PATCH(req({status:'approved',confirmApproval:true}),context)).status,401);
  authenticated=true;
  assert.equal((await c.exports.GET(new NextRequest('https://example.invalid/?approve=true'),context)).status,200);
  assert.equal((await c.exports.PATCH(req({status:'approved',confirmApproval:true},'https://evil.invalid'),context)).status,403);
  assert.equal((await c.exports.PATCH(req({status:'approved'}),context)).status,400);
  assert.equal((await c.exports.PATCH(req({status:'approved',confirmApproval:true}),context)).status,503);
  assert.equal(writes,0);assert.equal(mails,0);
  enabled=true;mailConfigured=false;
  assert.equal((await c.exports.PATCH(req({status:'approved',confirmApproval:true}),context)).status,503);assert.equal(writes,0);
  mailConfigured=true;
  let response=await c.exports.PATCH(req({status:'approved',confirmApproval:true}),context);
  assert.equal(response.status,200);assert.equal((await response.json()).notificationQueued,true);
  assert.equal(writes,1);assert.equal(mails,0);
 }finally{c.restore();if(previousMailFlag===undefined)delete process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED;else process.env.TIN_DISTRIBUTOR_RECOVERY_MAIL_ENABLED=previousMailFlag;}
});

test('durable account transaction inserts a hash and never overwrites an existing account',async()=>{
 let pending=true,conflict=false,inserts=0,storedHash;
 const app={id:'synthetic-id',email:'TEST@example.invalid',companyName:'Synthetic',contactName:'Test'};
 const tx={distributorApplication:{updateMany:async()=>({count:pending?1:0}),findUniqueOrThrow:async()=>app},$executeRaw:async(strings,...values)=>{assert.ok(strings.join('').includes('INSERT INTO'));assert.ok(!strings.join('').includes('ON CONFLICT'));assert.equal(values[0],'test@example.invalid');storedHash=values[2];if(conflict)throw Error('Duplicate');inserts++;}};
 const c=compile('lib/distributor-accounts.ts',{'./db':{prisma:{$transaction:async callback=>callback(tx)}},'./distributor-password':passwords});
 try{
  await c.exports.approveDistributorAccount(app.id,'synthetic-test-password');
  assert.equal(await passwords.verifyDistributorPassword('synthetic-test-password',storedHash),true);
  pending=false;await assert.rejects(c.exports.approveDistributorAccount(app.id,'synthetic-test-password'));assert.equal(inserts,1);
  pending=true;conflict=true;await assert.rejects(c.exports.approveDistributorAccount(app.id,'synthetic-test-password'));assert.equal(inserts,1);
 }finally{c.restore();}
});

test('sensitive credential email fails closed without logging body or recipient when provider absent',async()=>{
 const c=compile('lib/email.ts',{'./env':{env:{email:{}}}});
 const messages=[],originalLog=console.log,originalError=console.error;
 console.log=(...args)=>messages.push(args.join(' '));console.error=(...args)=>messages.push(args.join(' '));
 try{await assert.rejects(c.exports.sendEmailTo('synthetic@example.invalid',{subject:'synthetic',text:'synthetic-private-password',html:'synthetic-private-password'},{sensitive:true}));assert.deepEqual(messages,[]);}finally{console.log=originalLog;console.error=originalError;c.restore();}
});

test('actual middleware retains review query through unauthorized redirect',async()=>{
 const c=compile('middleware.ts',{'./lib/admin-session':{verifyAdminToken:async()=>false}});
 try{const response=await c.exports.middleware(new NextRequest('https://www.customtintackers.com/admin/distributors?application=synthetic-id'));
 const target=new URL(response.headers.get('location'));assert.equal(target.pathname,'/admin/login');assert.equal(target.searchParams.get('next'),'/admin/distributors?application=synthetic-id');}finally{c.restore();}
});

test('sensitive SMTP delivery requires verified TLS instead of opportunistic plaintext fallback',async()=>{
 let transportOptions;
 const c=compile('lib/email.ts',{'./env':{env:{email:{smtpHost:'synthetic.invalid',smtpPort:'587',smtpUser:'synthetic',smtpPass:'synthetic-only'}}},nodemailer:{__esModule:true,default:{createTransport:options=>{transportOptions=options;return {sendMail:async()=>({})};}}}});
 const original=console.log;console.log=()=>{};
 try{await c.exports.sendEmailTo('synthetic@example.invalid',{subject:'synthetic',text:'synthetic-only',html:'synthetic-only'},{sensitive:true});assert.equal(transportOptions.requireTLS,true);assert.equal(transportOptions.tls.rejectUnauthorized,true);}finally{console.log=original;c.restore();}
});
