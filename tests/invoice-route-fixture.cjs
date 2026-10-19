const Module=require('node:module'),path=require('node:path'),fs=require('node:fs'),ts=require('typescript');
const {invoiceRepository}=require('../src/lib/commerce/invoice.ts'),{savedAttachment}=require('../src/lib/design/proof-attachment.ts');
module.exports=async()=>{
 const record={id:'design-fixture',ownerId:'owner-fixture',productId:'p',shape:'square',width:18,height:18,canvasJson:JSON.stringify({objects:[{type:'Rect',width:20,height:20,proofId:'logo'}],proofIntent:{version:1,status:'unapproved',preference:'no'}}),sourceRevisionId:'src-'+'a'.repeat(64)};
 const a=await savedAttachment(record,'p');record.sourceHash=a.sourceHash;const orders=new Map(),jobs=new Map();let owner='owner-fixture';
 const invoices=invoiceRepository({transaction:async work=>work({byRequest:async(o,k)=>orders.get(o+':'+k)||null,insert:async(k,o)=>orders.set(o.ownerId+':'+k,o),enqueueOnce:async(k,o)=>jobs.set(k,o)})});
 const d={principal:async()=>({ownerId:owner}),products:async()=>[{id:'p',shape:'square',dimensions:{width:18,height:18},inStock:true,minimumOrder:1,backingOptions:['standard'],setupFee:0,pricingTiers:[{minQuantity:1,maxQuantity:null,pricePerUnit:100}]}],backings:[{id:'standard',priceMultiplier:1}],design:async()=>record,invoices,invoiceById:async id=>[...orders.values()].find(o=>o.id===id&&o.ownerId===owner)||null};
 const original=Module._load,stubs={'@/lib/persistence/server':{productionContext:async()=>d},'@/lib/spam-protection':{rateLimit:()=>null,detectSpam:()=>null}};
 const load=relative=>{const filename=path.resolve(__dirname,'../src/app/api',relative),m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);return m.exports;};
 Module._load=function(id,p,m){return stubs[id]||original.call(this,id,p,m);};let post,get;try{post=load('orders/invoice/route.ts').POST;get=load('orders/invoice/status/route.ts').GET;}finally{Module._load=original;}
 const body={name:'Synthetic',email:'synthetic@example.invalid',items:[{productId:'p',quantity:2,backingId:'standard',designId:record.id,proofAttachment:a}]};
 const request=(b,key='fixture-invoice-key-0001',origin='https://example.invalid')=>new Request('https://example.invalid/api/orders/invoice',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(b)});
 return {record,body,orders,jobs,post,get,request,setOwner:v=>owner=v};
};
