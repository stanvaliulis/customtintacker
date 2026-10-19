import {createHash} from 'node:crypto';
import {savedAttachment} from '../design/proof-attachment';
import {MAX_DESIGN_BYTES} from '../design/document';
import {StorageError,type Repository,type BlobStore} from '../artwork-storage/service';
/** Resolve the owned current immutable source for invoice/cart validation; never fetch a browser URL. */
export function ownedStoredDesign(repository:Repository,blobs:BlobStore){return async(id:string,ownerId:string)=>{
 const r=await repository.head(ownerId,id,'source');if(!r)return null;
 if(r.kind!=='source'||r.ownerId!==ownerId||r.designId!==id)throw new StorageError('Owned source mismatch.',403);
 const bytes=await blobs.read(r.document.key);if(bytes.length>MAX_DESIGN_BYTES||bytes.length!==r.document.bytes||createHash('sha256').update(bytes).digest('hex')!==r.document.sha256)throw new StorageError('Saved source integrity failure.',503);
 const record={id,ownerId,productId:r.product.id,shape:r.product.shape,width:r.product.width,height:r.product.height,canvasJson:new TextDecoder('utf-8',{fatal:true}).decode(bytes),sourceRevisionId:r.id,sourceHash:r.sourceHash};
 if((await savedAttachment(record,r.product.id)).sourceHash!==r.sourceHash)throw new StorageError('Saved source review mismatch.',409);
 return record;
};}
