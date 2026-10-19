import {StorageError,type Receipt,type Repository,type Revision,type SourceRevision} from './service';
export interface StorageTransaction {
 receipt(ownerId:string,key:string):Promise<Receipt|null>;
 source(ownerId:string,id:string):Promise<SourceRevision|null>;
 head(ownerId:string,designId:string,kind:Revision['kind']):Promise<Revision|null>;
 insertRevision(revision:Revision):Promise<void>;
 compareAndSwapHead(ownerId:string,designId:string,kind:Revision['kind'],expected:string|null,next:string):Promise<boolean>;
 insertReceipt(ownerId:string,key:string,receipt:Receipt):Promise<void>;
}
/** Adapter must run SERIALIZABLE transactions with bounded serialization retries; all writes
 * roll back on rejection. Unique owner/key, revision ID and owner/design/kind/version constraints
 * must be enforced in the database. Source head read and proof write share the transaction. */
export interface StorageTransactionStore {transaction<T>(work:(tx:StorageTransaction)=>Promise<T>):Promise<T>}
export function transactionalStorage(store:StorageTransactionStore):Repository {
 return {
  receipt:(o,k)=>store.transaction(tx=>tx.receipt(o,k)),
  source:(o,id)=>store.transaction(tx=>tx.source(o,id)),
  head:(o,id,kind)=>store.transaction(tx=>tx.head(o,id,kind)),
  commit:x=>store.transaction(async tx=>{
   if(x.revision.ownerId!==x.ownerId)throw new StorageError('Owner mismatch.',403);
   const old=await tx.receipt(x.ownerId,x.key);
   if(old){if(old.requestHash!==x.requestHash||old.revision.ownerId!==x.ownerId)throw new StorageError('Retry conflict.',409);return old;}
   const r=x.revision,head=await tx.head(x.ownerId,r.designId,r.kind);
   if((head?.id||null)!==x.expectedHead||r.parentId!==x.expectedHead||r.version!==(head?.version||0)+1)throw new StorageError('Stale revision.',409);
   if(r.kind==='proof'){
    const source=await tx.source(x.ownerId,r.sourceId),current=await tx.head(x.ownerId,r.designId,'source');
    if(!source||source.designId!==r.designId||source.sourceHash!==r.sourceHash||source.product.id!==r.productId||current?.id!==source.id||x.expectedSourceHead!==source.id)throw new StorageError('Proof source changed.',409);
   }
   await tx.insertRevision(r);
   if(!await tx.compareAndSwapHead(x.ownerId,r.designId,r.kind,x.expectedHead,r.id))throw new StorageError('Concurrent revision.',409);
   const receipt={requestHash:x.requestHash,revision:r};await tx.insertReceipt(x.ownerId,x.key,receipt);return receipt;
  }),
 };
}
