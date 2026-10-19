import {createHash} from 'node:crypto';
import {publishSource,StorageError,type Dependencies,type Draft} from '../artwork-storage/service';
import {savedAttachment,canonical} from '../design/proof-attachment';
/** New immutable design identity per content. Never adopts a legacy client sessionId or ownerId. */
export async function saveOwnedArtwork(raw:unknown,d:Omit<Dependencies,'draft'>){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new StorageError('Invalid artwork.');
 const b=raw as Record<string,unknown>,who=await d.principal();if(!who)throw new StorageError('Verified artwork owner required.',401);
 if(typeof b.productId!=='string'||typeof b.shape!=='string'||typeof b.width!=='number'||typeof b.height!=='number'||typeof b.canvasJson!=='string')throw new StorageError('Invalid artwork fields.');
 if(b.thumbnailDataUrl)throw new StorageError('Private artwork saves do not accept public thumbnails.');
 const content={productId:b.productId,shape:b.shape,width:b.width,height:b.height,canvasJson:b.canvasJson};
 const digest=createHash('sha256').update(canonical({ownerId:who.ownerId,...content})).digest('hex'),id='design-'+digest;
 const draft:Draft={...content,id,ownerId:who.ownerId};
 const attachment=await savedAttachment(draft,draft.productId);
 let canvas;try{canvas=JSON.parse(draft.canvasJson);}catch{throw new StorageError('Invalid artwork document.');}
 const revision=await publishSource({designId:id,key:'save-'+digest,expectedHead:null,expectedSourceHash:attachment.sourceHash,workflow:canvas.guidedUpload?'upload':'diy'},{...d,principal:async()=>who,draft:async(ownerId,designId)=>ownerId===who.ownerId&&designId===id?draft:null});
 return {id,sourceRevisionId:revision.id,sourceHash:revision.sourceHash,thumbnailUrl:''};
}
