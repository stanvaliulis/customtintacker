import 'server-only';
import {cookies} from 'next/headers';
import {auth} from '../auth';
import {prisma} from '../db';
import {getAllProducts} from '../products';
import {backingOptions} from '../../data/products';
import {StorageError} from '../artwork-storage/service';
import {postgresAdapters} from './postgres';
import {vercelPrivateBlobs} from './vercel-private';
import {ownedStoredDesign} from './owned-design';
import {accountOwner,OWNER_COOKIE,verifyGuestOwner,createGuestOwner,OWNER_SECONDS} from './request-security';
import type {InvoiceRequest} from '../commerce/invoice';

async function configured(){
 if(process.env.TIN_WORKFLOW_ENABLED!=='1'||!process.env.POSTGRES_PRISMA_URL||!process.env.ARTWORK_BLOB_READ_WRITE_TOKEN)throw new StorageError('Private artwork and invoice requests are not active yet.',503);
 const rows=await prisma.$queryRawUnsafe<Array<{version:number}>>('SELECT version FROM tin_workflow.schema_version WHERE singleton=true');
 if(rows.length!==1||rows[0].version!==1)throw new StorageError('Artwork schema is not ready.',503);
}
export async function productionContext(createOwner=false){
 await configured();
 const session=await auth(),jar=await cookies();let ownerId:string|null=null,newToken:string|undefined;
 if(session?.user){
  if(!session.user.id||!session.expires||!Number.isFinite(Date.parse(session.expires))||Date.parse(session.expires)<=Date.now())throw new StorageError('Verified unexpired account subject required.',401);
  ownerId=accountOwner(session.user.id);
 }else{
  ownerId=verifyGuestOwner(jar.get(OWNER_COOKIE)?.value,process.env.AUTH_SECRET||'');
  if(!ownerId&&createOwner){const issued=createGuestOwner(process.env.AUTH_SECRET||'');ownerId=issued.ownerId;newToken=issued.token;}
 }
 if(!ownerId)throw new StorageError('Open a new artwork session before saving. Previously saved artwork requires its original session.',401);
 if(createOwner)await prisma.$executeRawUnsafe('INSERT INTO tin_workflow.owner(id) VALUES($1) ON CONFLICT DO NOTHING',ownerId);
 const accounts=await prisma.$queryRawUnsafe<Array<{disabled:boolean}>>('SELECT disabled FROM tin_workflow.owner WHERE id=$1',ownerId);
 if(accounts.length!==1||accounts[0].disabled)throw new StorageError('Artwork account unavailable.',403);
 if(newToken)jar.set(OWNER_COOKIE,newToken,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:OWNER_SECONDS});
 const owner=ownerId,adapters=postgresAdapters(prisma),blobs=vercelPrivateBlobs(process.env.ARTWORK_BLOB_READ_WRITE_TOKEN!);
 const principal=async()=>({ownerId:owner,canPrepareProofs:false,role:session?.user?.role,discountTier:session?.user?.discountTier});
 const design=ownedStoredDesign(adapters.storage,blobs);
 return {...adapters,blobs,principal,design,products:getAllProducts,backings:backingOptions,
  product:async(id:string)=>{const p=(await getAllProducts()).find(p=>p.id===id);return p?{id:p.id,shape:p.shape,width:p.dimensions.width,height:p.dimensions.height}:null;},
  invoiceById:async(id:string)=>{const rows=await prisma.$queryRawUnsafe<Array<{payload:InvoiceRequest}>>('SELECT payload FROM tin_workflow.invoice_request WHERE owner_id=$1 AND id=$2',owner,id);return rows[0]?.payload||null;}
 };
}
