import {artworkMime, rasterDimensions} from './upload-files';
import type {EmbossPreference} from './proof-intent';

export interface GuidedReview {
 version:1; product:{id:string;shape:string;width:number;height:number};
 original:{name:string;data:string}; embossPreference:string; selectedRegions:string[];
 customerDecision:string; notes:string; productionApproval:'unapproved'; delivery:'local-only-not-submitted';
}
export const guidedPreference=(p:GuidedReview):EmbossPreference=>p.embossPreference==='suggested'?'yes':p.embossPreference==='flat'?'no':'unsure';
/** Stored proposals are data, never executable SVG or approved manufacturing geometry. */
export function validateGuided(value:unknown):asserts value is GuidedReview {
 const p=value as GuidedReview;
 if(!p||p.version!==1||!p.product||typeof p.product.id!=='string'||!p.product.id||typeof p.product.shape!=='string'||![p.product.width,p.product.height].every(n=>Number.isFinite(n)&&n>0&&n<=120)||!p.original||typeof p.original.name!=='string'||typeof p.original.data!=='string'||typeof p.notes!=='string'||p.notes.length>2000||!['suggested','flat','team'].includes(p.embossPreference)||!['direction-approved','team-proof-requested'].includes(p.customerDecision)||p.productionApproval!=='unapproved'||p.delivery!=='local-only-not-submitted'||!Array.isArray(p.selectedRegions)||p.selectedRegions.length>6||p.selectedRegions.some(id=>typeof id!=='string'||!/^region-\d{1,3}$/.test(id))||new Set(p.selectedRegions).size!==p.selectedRegions.length)throw Error('Invalid guided review. Confirm your direction before saving.');
 if(p.embossPreference==='suggested'&&!p.selectedRegions.length)throw Error('Choose raised areas or ask the team for advice.');
 const mime=artworkMime(p.original.name),prefix=`data:${mime};base64,`;
 if(!p.original.data.startsWith(prefix))throw Error('Guided artwork must contain original embedded bytes.');
 const encoded=p.original.data.slice(prefix.length);
 if(!encoded.length||encoded.length>8*1024*1024||encoded.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error('Invalid or oversized embedded artwork. Keep the recovery packet for larger files.');
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 if(['image/png','image/jpeg','image/webp'].includes(mime))rasterDimensions(bytes,mime);
 if(mime!=='image/svg+xml'&&p.selectedRegions.length)throw Error('This artwork has no automatic raised-area selections.');
}
export function guidedCanvas(packet:GuidedReview) {
 validateGuided(packet);
 return {objects:[],proofIntent:{version:1,status:'unapproved',preference:guidedPreference(packet)},guidedUpload:packet};
}
