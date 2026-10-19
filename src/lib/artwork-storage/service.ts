import {createHash} from 'node:crypto';
import {canonical,savedAttachment,sourceFromRecord,type ProofAttachment} from '../design/proof-attachment';
import {MAX_DESIGN_BYTES} from '../design/document';
import {artworkMime,MAX_ART_BYTES,rasterDimensions} from '../design/upload-files';

export class StorageError extends Error {constructor(message:string,public status=400){super(message);}}
export interface Draft {id:string;ownerId:string;productId:string;shape:string;width:number;height:number;canvasJson:string}
export interface StoredObject {key:string;sha256:string;bytes:number;mime:string;name:string}
export interface SourceRevision {
 schemaVersion:1;kind:'source';id:string;ownerId:string;designId:string;version:number;parentId:string|null;
 product:{id:string;shape:string;width:number;height:number};workflow:'diy'|'upload';sourceHash:string;
 document:StoredObject;original?:StoredObject;attachment:ProofAttachment;productionApproval:'unapproved';
}
export interface ProofRevision {
 schemaVersion:1;kind:'proof';id:string;ownerId:string;designId:string;version:number;parentId:string|null;
 sourceId:string;sourceHash:string;productId:string;print:StoredObject;emboss?:StoredObject;productionApproval:'unapproved';
}
export type Revision=SourceRevision|ProofRevision;
export interface Receipt {requestHash:string;revision:Revision}
export interface Repository {
 receipt(ownerId:string,key:string):Promise<Receipt|null>;
 source(ownerId:string,id:string):Promise<SourceRevision|null>;
 head(ownerId:string,designId:string,kind:'source'|'proof'):Promise<Revision|null>;
 /** One transaction: unique(owner,key), immutable revision insert, CAS head, and (for proof) current source check.
  * Same key/hash replays its original receipt. Different hash or stale heads throw 409; no partial commits.
  * Never trust a browser ownerId. Implementations must enforce owner scope on every query. */
 commit(input:{ownerId:string;key:string;requestHash:string;expectedHead:string|null;expectedSourceHead?:string;revision:Revision}):Promise<Receipt>;
}
export interface BlobStore {
 /** Private, create-if-absent, never overwrite. Same key must mean identical bytes+metadata. No public URLs. */
 putIfAbsent(object:StoredObject,bytes:Uint8Array):Promise<void>;
 read(key:string):Promise<Uint8Array>;
}
export interface Dependencies {
 principal():Promise<{ownerId:string;canPrepareProofs:boolean}|null>;
 draft(ownerId:string,id:string):Promise<Draft|null>;
 product(id:string):Promise<{id:string;shape:string;width:number;height:number}|null>;
 repository:Repository;blobs:BlobStore;
}
const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const id=(value:unknown,label:string)=>{if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,160}$/.test(value))throw new StorageError('Invalid '+label);return value;};
const headId=(v:string|null)=>v===null?null:id(v,'parent revision');
async function owner(d:Dependencies){const p=await d.principal();if(!p?.ownerId)throw new StorageError('Authenticated owner required.',401);id(p.ownerId,'owner');return p;}
async function replay(d:Dependencies,ownerId:string,key:string,requestHash:string){const old=await d.repository.receipt(ownerId,key);if(old){if(old.requestHash!==requestHash)throw new StorageError('Retry key belongs to different content.',409);if(old.revision.ownerId!==ownerId)throw new StorageError('Revision unavailable.',403);}return old?.revision;}
async function parent(d:Dependencies,ownerId:string,designId:string,kind:'source'|'proof',expected:string|null){const p=await d.repository.head(ownerId,designId,kind);if(p&&(p.ownerId!==ownerId||p.designId!==designId||p.kind!==kind))throw new StorageError('Revision unavailable.',403);if((p?.id||null)!==expected)throw new StorageError('Revision changed; reload before saving.',409);return p;}
function checkedBytes(name:string,bytes:Uint8Array){
 if(typeof name!=='string'||!name.length||name.length>255||/[\x00-\x1f/\\]/.test(name))throw new StorageError('Invalid artwork filename.');
 const mime=artworkMime(name);if(!bytes.length||bytes.length>MAX_ART_BYTES)throw new StorageError('Artwork must be nonempty and at most 15 MiB.');
 if(['image/png','image/jpeg','image/webp'].includes(mime))rasterDimensions(bytes,mime);
 const header=new TextDecoder().decode(bytes.subarray(0,256)).trimStart();
 if(mime==='application/pdf'&&!header.startsWith('%PDF-'))throw new StorageError('Invalid PDF header.');
 if(mime==='application/postscript'&&!header.startsWith('%!PS')&&!header.startsWith('%PDF-'))throw new StorageError('Invalid AI/PostScript header.');
 if(mime==='image/svg+xml'&&!/^(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(header))throw new StorageError('Invalid SVG header.');
 return mime;
}
async function write(d:Dependencies,ownerId:string,designId:string,name:string,bytes:Uint8Array,mime:string):Promise<StoredObject>{
 const sha256=hash(bytes),key=`artwork/${hash(ownerId)}/${hash(designId)}/${hash(canonical({sha256,mime,name}))}`;
 const object={key,sha256,bytes:bytes.length,mime,name};
 await d.blobs.putIfAbsent(object,bytes);
 const readback=await d.blobs.read(key);
 if(readback.length!==bytes.length||hash(readback)!==sha256)throw new StorageError('Stored object verification failed; no revision committed.',503);
 return object;
}
/** Local orchestration only: no configured adapter, routes, credentials or migrations. */
export async function publishSource(request:{designId:string;key:string;expectedHead:string|null;expectedSourceHash:string;workflow:'diy'|'upload'},d:Dependencies):Promise<SourceRevision>{
 request={...request};
 const who=await owner(d),designId=id(request.designId,'design'),key=id(request.key,'retry key'),expected=headId(request.expectedHead);
 if(!/^[a-f0-9]{64}$/.test(request.expectedSourceHash)||!['diy','upload'].includes(request.workflow))throw new StorageError('Invalid review binding.');
 const requestHash=hash(canonical({kind:'source',ownerId:who.ownerId,...request})),old=await replay(d,who.ownerId,key,requestHash);if(old){if(old.kind!=='source')throw new StorageError('Retry kind mismatch.',409);return old;}
 const previous=await parent(d,who.ownerId,designId,'source',expected),loaded=await d.draft(who.ownerId,designId);
 if(!loaded||loaded.ownerId!==who.ownerId||loaded.id!==designId)throw new StorageError('Design unavailable for this owner.',403);
 const draft=structuredClone(loaded);
 if(typeof draft.canvasJson!=='string'||Buffer.byteLength(draft.canvasJson,'utf8')>MAX_DESIGN_BYTES)throw new StorageError('Saved design exceeds 8 MiB.');
 const source=sourceFromRecord(draft),attachment=await savedAttachment(draft,draft.productId);
 if(attachment.sourceHash!==request.expectedSourceHash)throw new StorageError('Reviewed artwork has changed.',409);
 const product=await d.product(draft.productId);if(!product||product.id!==draft.productId||product.shape!==draft.shape||product.width!==draft.width||product.height!==draft.height)throw new StorageError('Product or dimensions changed.',409);
 const guided=source.canvas.guidedUpload as {original:{name:string;data:string}}|undefined;
 if(!!guided!==(request.workflow==='upload'))throw new StorageError('DIY and guided reviews must remain separate.');
 // A remote image reference is not an immutable original. Capture/own it before activation.
 const check=(objects:Record<string,unknown>[])=>{for(const o of objects){if(typeof o.src==='string'&&!o.src.startsWith('data:'))throw new StorageError('External DIY assets must be captured before immutable saving.');if(Array.isArray(o.objects))check(o.objects);}};
 check(source.canvas.objects as Record<string,unknown>[]);
 let original:StoredObject|undefined;
 if(guided){const bytes=Uint8Array.from(Buffer.from(guided.original.data.split(',')[1],'base64'));const mime=checkedBytes(guided.original.name,bytes);original=await write(d,who.ownerId,designId,guided.original.name,bytes,mime);}
 const document=await write(d,who.ownerId,designId,'source.json',Buffer.from(draft.canvasJson,'utf8'),'application/json');
 const revision:SourceRevision={schemaVersion:1,kind:'source',id:'src-'+requestHash,ownerId:who.ownerId,designId,version:(previous?.version||0)+1,parentId:expected,product,workflow:request.workflow,sourceHash:attachment.sourceHash,document,...(original?{original}:{}),attachment,productionApproval:'unapproved'};
 const result=await d.repository.commit({ownerId:who.ownerId,key,requestHash,expectedHead:expected,revision});
 if(result.requestHash!==requestHash||result.revision.kind!=='source'||result.revision.ownerId!==who.ownerId)throw new StorageError('Commit receipt mismatch.',503);
 return result.revision;
}
export async function publishProof(request:{sourceId:string;key:string;expectedHead:string|null;print:{name:string;bytes:Uint8Array};emboss?:{name:string;bytes:Uint8Array}},d:Dependencies):Promise<ProofRevision>{
 request={...request,print:{name:request.print.name,bytes:Uint8Array.from(request.print.bytes)},...(request.emboss?{emboss:{name:request.emboss.name,bytes:Uint8Array.from(request.emboss.bytes)}}:{})};
 const who=await owner(d);if(!who.canPrepareProofs)throw new StorageError('Proof preparation permission required.',403);
 id(request.sourceId,'source');id(request.key,'retry key');headId(request.expectedHead);
 // Request and buffers were snapshotted before authentication awaited.
 const print=request.print,emboss=request.emboss;
 const printMime=checkedBytes(print.name,print.bytes),embossMime=emboss?checkedBytes(emboss.name,emboss.bytes):undefined;
 if(!['application/pdf','image/png','image/svg+xml'].includes(printMime)||embossMime&&!['application/pdf','image/svg+xml'].includes(embossMime))throw new StorageError('Unsupported proof format.');
 const requestHash=hash(canonical({kind:'proof',sourceId:request.sourceId,expectedHead:request.expectedHead,print:{name:print.name,sha:hash(print.bytes)},emboss:emboss?{name:emboss.name,sha:hash(emboss.bytes)}:null}));
 const old=await replay(d,who.ownerId,request.key,requestHash);if(old){if(old.kind!=='proof')throw new StorageError('Retry kind mismatch.',409);return old;}
 const source=await d.repository.source(who.ownerId,request.sourceId);
 if(!source||source.ownerId!==who.ownerId)throw new StorageError('Source unavailable for this owner.',403);
 if(source.attachment.emboss.preference==='yes'&&!emboss)throw new StorageError('This source requires a paired emboss proof.');
 await parent(d,who.ownerId,source.designId,'source',source.id);
 const previous=await parent(d,who.ownerId,source.designId,'proof',request.expectedHead);
 const printObject=await write(d,who.ownerId,source.designId,print.name,print.bytes,printMime),embossObject=emboss?await write(d,who.ownerId,source.designId,emboss.name,emboss.bytes,embossMime!):undefined;
 const revision:ProofRevision={schemaVersion:1,kind:'proof',id:'proof-'+requestHash,ownerId:who.ownerId,designId:source.designId,version:(previous?.version||0)+1,parentId:request.expectedHead,sourceId:source.id,sourceHash:source.sourceHash,productId:source.product.id,print:printObject,...(embossObject?{emboss:embossObject}:{}),productionApproval:'unapproved'};
 const result=await d.repository.commit({ownerId:who.ownerId,key:request.key,requestHash,expectedHead:request.expectedHead,expectedSourceHead:source.id,revision});
 if(result.requestHash!==requestHash||result.revision.kind!=='proof'||result.revision.ownerId!==who.ownerId)throw new StorageError('Commit receipt mismatch.',503);
 return result.revision;
}
export function storageDependencies():never{throw new StorageError('Durable storage is not configured. Approved ownership, private object storage and atomic repository adapters are required.',503);}
