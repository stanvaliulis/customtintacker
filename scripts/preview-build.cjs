const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const run=(args)=>{const r=cp.spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:20e6});if(r.status!==0)throw Error('Preview build step failed: '+args.slice(0,3).join(' '));return r.stdout;};
(async()=>{let db;try{
 if(process.env.VERCEL_ENV!=='preview'||process.env.TIN_ISOLATED_PREVIEW!=='1')throw Error('Preview-only build required');
 const raw=process.env.TINTEST_POSTGRES_PRISMA_URL||'',u=new URL(raw);
 if(!u.hostname.endsWith('.neon.tech')||u.hostname.includes('ep-jolly-shape-a4ni83gl')||process.env.POSTGRES_PRISMA_URL||process.env.RESEND_API_KEY||process.env.STRIPE_SECRET_KEY)throw Error('Isolation preflight failed');
 const blobToken=process.env.BLOB_READ_WRITE_TOKEN||'';if(!blobToken.toLowerCase().includes('vkzmjn6etvre1a3k'.toLowerCase()))throw Error('Dedicated Blob identity mismatch');
 process.env.POSTGRES_PRISMA_URL=raw;process.env.POSTGRES_URL_NON_POOLING=process.env.TINTEST_POSTGRES_URL_NON_POOLING||raw;
 run(['node_modules/prisma/build/index.js','generate']);
 const {PrismaClient}=require('@prisma/client');db=new PrismaClient();
 const tables=await db.$queryRawUnsafe("SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_type='BASE TABLE'");
 if(tables.length===0){
 const base=run(['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script']);
 const workflow=fs.readFileSync('scripts/preview-workflow.sql','utf8');const payment=fs.readFileSync('migrations/payment-ledger-v1.sql','utf8').replace(/^BEGIN;\s*$/gm,'').replace(/^COMMIT;\s*$/gm,'');
 const sql='BEGIN;\n'+base+'\n'+workflow+'\n'+payment+"\nCREATE SCHEMA tin_preview; CREATE TABLE tin_preview.identity (id text PRIMARY KEY); INSERT INTO tin_preview.identity VALUES ('customtintacker-preview-test-20261020');\nCOMMIT;";
 fs.writeFileSync('/tmp/tin-preview-bootstrap.sql',sql);run(['node_modules/prisma/build/index.js','db','execute','--schema','prisma/schema.prisma','--file','/tmp/tin-preview-bootstrap.sql']);
 }else{const id=await db.$queryRawUnsafe('SELECT id FROM tin_preview.identity');if(id.length!==1||id[0].id!=='customtintacker-preview-test-20261020')throw Error('Existing database is not this synthetic Preview');}
 const counts=await db.$queryRawUnsafe('SELECT (SELECT count(*)::int FROM tin_workflow.owner) AS owners,(SELECT version FROM tin_workflow.schema_version) AS workflow,(SELECT version FROM tin_payments.schema_version) AS payments');
 console.log('PREVIEW_DATABASE_VERIFIED '+JSON.stringify({isolated:true,...counts[0],productionEndpoint:false}));await db.$disconnect();db=null;
 const blob=require('@vercel/blob'),bytes=Buffer.from('Tin Tackers synthetic private storage verification 2026-10-20');const obj=await blob.put('preview-validation/connectivity-20261020.txt',bytes,{token:blobToken,access:'private',addRandomSuffix:false,allowOverwrite:true});const got=await blob.get(obj.url,{token:blobToken,access:'private',useCache:false});if(!got||got.statusCode!==200)throw Error('Private storage read failed');const parts=[];for await(const b of got.stream)parts.push(b);if(!Buffer.concat(parts).equals(bytes))throw Error('Private storage integrity mismatch');console.log('PREVIEW_PRIVATE_STORAGE_VERIFIED '+JSON.stringify({storeId:'store_vkZMJn6eTVRE1A3K',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}));
 require('tsx/cjs');
 const {vercelPrivateBlobs}=require('../src/lib/persistence/vercel-private.ts');
 const testBytes=Buffer.from('{"synthetic":true}'),testHash=crypto.createHash('sha256').update(testBytes).digest('hex'),testKey='artwork/'+testHash+'/'+testHash+'/'+testHash;
 try{await vercelPrivateBlobs(blobToken).putIfAbsent({key:testKey,bytes:testBytes.length,mime:'application/json',sha256:testHash,name:'synthetic.json'},testBytes);console.log('PREVIEW_ARTWORK_ADAPTER_VERIFIED');}
 catch(e){const info=await blob.get(testKey,{token:blobToken,access:'private',useCache:false});console.log('PREVIEW_ARTWORK_ADAPTER_DIAGNOSTIC',JSON.stringify({status:info?.statusCode,mime:info?.blob?.contentType,size:info?.blob?.size,expectedSize:testBytes.length,message:e.message}));throw Error('Synthetic artwork adapter check failed');}
 // Next runtime performs its own aliases; remove build-time alias before loading application modules.
 delete process.env.POSTGRES_PRISMA_URL;delete process.env.POSTGRES_URL_NON_POOLING;
 const result=cp.spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit'});process.exitCode=result.status??1;
 }catch(e){console.error('Preview preparation failed:',e.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[REDACTED]'));process.exitCode=1;}finally{if(db)await db.$disconnect();}})();
