import 'server-only';
import {isAdminAuthenticated} from '../admin-auth';
import {prisma} from '../db';
import {StorageError,type SourceRevision} from '../artwork-storage/service';
import type {InvoiceRequest} from '../commerce/invoice';
import {vercelPrivateBlobs} from './vercel-private';
import {createHash} from 'node:crypto';
/** Staff access is a separate signed administrator session, never a customer-controlled owner claim. */
export async function staffInvoice(id:string){
 if(!(await isAdminAuthenticated()))throw new StorageError('Administrator sign-in required.',401);
 if(process.env.TIN_WORKFLOW_ENABLED!=='1')throw new StorageError('Invoice requests are not active.',503);
 if(!/^[0-9a-f-]{36}$/.test(id))throw new StorageError('Invalid invoice request ID.');
 const rows=await prisma.$queryRawUnsafe<Array<{payload:InvoiceRequest}>>('SELECT payload FROM tin_workflow.invoice_request WHERE id=$1',id);
 if(rows.length!==1)throw new StorageError('Invoice request unavailable.',404);
 const order=rows[0].payload;if(order.id!==id||order.status!=='invoice-requested'||order.paid!==false)throw new StorageError('Invoice request state mismatch.',409);
 return order;
}
export async function staffArtwork(orderId:string,sourceId:string,kind:'document'|'original'){
 const order=await staffInvoice(orderId),binding=order.sources.find(s=>s.revisionId===sourceId);if(!binding)throw new StorageError('Artwork not part of this invoice request.',404);
 const rows=await prisma.$queryRawUnsafe<Array<{payload:SourceRevision}>>("SELECT payload FROM tin_workflow.revision WHERE owner_id=$1 AND id=$2 AND kind='source'",order.ownerId,sourceId);
 const source=rows[0]?.payload;if(!source||source.ownerId!==order.ownerId||source.designId!==binding.designId||source.sourceHash!==binding.sourceHash)throw new StorageError('Invoice artwork binding mismatch.',409);
 const object=kind==='original'?source.original:source.document;if(!object)throw new StorageError('Original file unavailable for this workflow.',404);
 const bytes=await vercelPrivateBlobs(process.env.ARTWORK_BLOB_READ_WRITE_TOKEN||'').read(object.key);
 if(bytes.length!==object.bytes||createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw new StorageError('Artwork integrity check failed.',503);
 return {bytes,name:object.name.replace(/[^A-Za-z0-9._-]/g,'_')};
}
