const {test}=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const path=require('node:path');
const fs=require('node:fs');
const ts=require('typescript');
const {NextRequest}=require('next/server');
const {designTemplates}=require('../src/data/design-templates.ts');

test('designer integration contracts use synthetic in-memory database, filesystem and email fixtures',async t=>{
  let configured=true,fail=false,saved,quote,email,quotes=[];
  const files=new Map();
  const artwork=JSON.stringify({version:'6.0.0',objects:[{type:'Textbox',text:'Synthetic integration artwork',left:24,top:36}]});
  const custom={id:'synthetic-custom-rectangle',name:'Synthetic layout',shape:'rectangle',width:24,height:12,isActive:true,canvasJson:artwork};
  const inactive={...custom,id:'synthetic-inactive',isActive:false};
  const duplicate={...custom,id:designTemplates[0].id,shape:designTemplates[0].shape};
  const rows=[custom,inactive,duplicate];
  const check=()=>{if(fail)throw new Error('Synthetic dependency failure');};
  const prisma={
    designTemplate:{findMany:async({where})=>{check();assert.equal(where.isActive,true);return rows.filter(r=>r.isActive&&(!where.shape||r.shape===where.shape));},findUnique:async({where})=>{check();return rows.find(r=>r.id===where.id)||null;}},
    savedDesign:{findFirst:async({where})=>{check();return saved&&saved.sessionId===where.sessionId&&saved.productId===where.productId?saved:null;},create:async({data})=>{check();saved={id:'synthetic-saved',...data};return saved;},update:async({where,data})=>{check();assert.equal(where.id,saved.id);saved={...saved,...data};return saved;},findUnique:async({where})=>{check();return saved?.id===where.id?saved:null;}},
    quote:{create:async({data})=>{check();quote={id:'synthetic-quote',...data};return quote;}}
  };
  const stubs={
    '@/lib/env':{isDatabaseConfigured:()=>configured,isBlobConfigured:()=>false},'@/lib/db':{prisma},
    'fs/promises':{mkdir:async()=>{},writeFile:async(file,data)=>files.set(path.normalize(file),String(data)),readFile:async file=>{const v=files.get(path.normalize(file));if(v===undefined)throw new Error('Synthetic file absent');return v;}},
    '@/lib/json-store':{readJsonFile:()=>quotes,writeJsonFile:(_name,data)=>{quotes=data;}},
    '@/lib/email':{sendNotificationEmail:async value=>{email=value;return true;}},
    '@/lib/email-templates':{quoteRequestEmail:data=>data},
    '@/lib/spam-protection':{detectSpam:()=>null,rateLimit:()=>null}
  };
  const original=Module._load,oldFetch=global.fetch,oldError=console.error,oldPrisma=global.prisma;
  global.prisma=prisma;
  Module._load=function(id,parent,isMain){if(stubs[id])return stubs[id];return original.call(this,id,parent,isMain);};
  global.fetch=async()=>{throw new Error('Network forbidden in synthetic integration tests');};
  console.error=()=>{};
  try{
    // Compile the actual handlers to CJS so dynamic DB imports use the same
    // explicit mocks; tsx/cjs alone leaves native dynamic imports unresolved.
    const route=relative=>{const filename=path.resolve(__dirname,'../src/app/api',relative);const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(output,filename);return m.exports;};
    const list=route('design/templates/route.ts').GET;
    const detail=route('design/templates/[id]/route.ts').GET;
    const save=route('design/save/route.ts').POST;
    const load=route('design/load/[id]/route.ts').GET;
    const submitQuote=route('quote/route.ts').POST;
    const get=id=>({params:Promise.resolve({id})});
    const post=(url,body)=>new NextRequest('http://localhost'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const payload={sessionId:'synthetic-session',productId:'synthetic-product',shape:'rectangle',width:24,height:12,canvasJson:artwork};
    await t.test('active custom layouts are retained, built-ins win duplicate IDs, shape filters and inactive rejection work',async()=>{
      const all=await (await list(new NextRequest('http://localhost/api/design/templates'))).json();
      assert.equal(all.length,12);assert.equal(all.find(x=>x.id===duplicate.id).name,designTemplates[0].name);
      const filtered=await (await list(new NextRequest('http://localhost/api/design/templates?shape=rectangle'))).json();
      assert.ok(filtered.every(x=>x.shape==='rectangle'));assert.ok(filtered.some(x=>x.id===custom.id));
      assert.deepEqual(await (await detail(new NextRequest('http://localhost'),get(custom.id))).json(),custom);
      assert.equal((await detail(new NextRequest('http://localhost'),get(inactive.id))).status,404);
    });
    await t.test('save, same-product update and reopen preserve artwork and product dimensions',async()=>{
      const first=await (await save(post('/api/design/save',payload))).json();assert.equal(first.id,'synthetic-saved');
      const second=await (await save(post('/api/design/save',{...payload,canvasJson:artwork.replace('integration','updated')}))).json();assert.equal(second.id,first.id);
      const result=await (await load(new NextRequest('http://localhost'),get(first.id))).json();
      assert.equal(result.canvasJson,artwork.replace('integration','updated'));assert.equal(result.width,24);assert.equal(result.height,12);assert.equal(result.productId,payload.productId);
    });
    await t.test('filesystem fallback saves and reopens only synthetic in-memory content',async()=>{
      configured=false;
      const receipt=await (await save(post('/api/design/save',payload))).json();
      assert.equal(files.size,1);
      const result=await (await load(new NextRequest('http://localhost'),get(receipt.id))).json();assert.equal(result.canvasJson,artwork);assert.equal(result.productId,payload.productId);
      configured=true;
    });
    await t.test('opacity fractions survive database and filesystem save/reopen without unit migration',async()=>{
      for(const database of [true,false]) for(const opacity of [undefined,0,0.01,0.5,0.99,1,0.0099,0.1234]) {
        configured=database;
        const canvasJson=JSON.stringify({objects:[{type:'Rect',width:100,height:100,...(opacity===undefined?{}:{opacity})}]});
        const response=await save(post('/api/design/save',{...payload,canvasJson}));assert.equal(response.status,200);
        const receipt=await response.json();
        const reopened=await (await load(new NextRequest('http://localhost'),get(receipt.id))).json();
        assert.equal(reopened.canvasJson,canvasJson);
        assert.equal(JSON.parse(reopened.canvasJson).objects[0].opacity,opacity);
      }
      configured=true;
    });
    await t.test('quote reference survives database persistence, fallback and notification preparation',async()=>{
      const body={name:'Synthetic Tester',email:'qa@example.invalid',company:'Synthetic fixture',size:'24 x 12',quantity:50,embossing:'standard',designId:'synthetic-saved',notes:'Synthetic notes'};
      configured=true;let response=await submitQuote(post('/api/quote',body));assert.equal(response.status,201);
      assert.match(quote.message,/Design ID: synthetic-saved/);assert.equal(email.designId,body.designId);assert.equal(quote.quantity,50);
      configured=false;response=await submitQuote(post('/api/quote',body));assert.equal(response.status,201);assert.equal(quotes[0].designId,body.designId);assert.equal(email.designId,body.designId);
      configured=true;
    });
    await t.test('durable intent reconstructs through actual save/load contracts and quote persistence',async()=>{
      const {recoverSavedProof}=require('../src/lib/design/saved-proof.ts');
      const canvasJson=JSON.stringify({objects:[{type:'Rect',width:20,height:20,proofId:'proof-shape',embossRequested:true}],proofIntent:{version:1,status:'unapproved',preference:'yes'}});
      for(const database of [true,false]) {
        configured=database;
        const receipt=await (await save(post('/api/design/save',{...payload,canvasJson}))).json();
        const record=await (await load(new NextRequest('http://localhost'),get(receipt.id))).json();
        const intent=recoverSavedProof(record,receipt.id);
        assert.deepEqual(intent.selectedIds,['proof-shape']);assert.equal(intent.preference,'yes');
        const body={name:'Synthetic Tester',email:'qa@example.invalid',company:'Synthetic fixture',size:'24x12',quantity:50,embossing:intent.preference,designId:receipt.id,notes:intent.notes};
        assert.equal((await submitQuote(post('/api/quote',body))).status,201);
        assert.match(database?quote.message:quotes[0].notes,/proof-shape/);
        assert.equal(email.designId,receipt.id);assert.match(email.notes,/unapproved/);
      }
      configured=true;
    });
    await t.test('dependency failure retains built-ins and returns explicit save failure',async()=>{
      configured=true;fail=true;
      assert.equal((await (await list(new NextRequest('http://localhost/api/design/templates'))).json()).length,11);
      assert.equal((await save(post('/api/design/save',payload))).status,500);
      assert.equal((await detail(new NextRequest('http://localhost'),get(custom.id))).status,404);
      assert.equal((await load(new NextRequest('http://localhost'),get('synthetic-missing'))).status,404);
    });
  }finally{Module._load=original;global.fetch=oldFetch;console.error=oldError;if(oldPrisma===undefined)delete global.prisma;else global.prisma=oldPrisma;}
});
