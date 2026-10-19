import {analyzeVector,type Suggestion} from './upload-proof';
export const MAX_ART_BYTES=15*1024*1024,MAX_PACKET_BYTES=22*1024*1024,MAX_PIXELS=40000000;
export type Artwork={name:string;original:string;preview?:string;width:number;height:number;viewBox?:string;suggestions:Suggestion[];excluded:number;fallback?:string};
const mimeByExt:Record<string,string>={svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf',ai:'application/postscript'};
export function artworkMime(name:string){
 if(!name||name.length>200||/[\x00-\x1f\\/]/.test(name))throw Error('Use a filename under 200 characters without control characters.');
 const mime=mimeByExt[name.split('.').pop()!.toLowerCase()];if(!mime)throw Error('Choose SVG, PNG, JPG, WebP, PDF or AI artwork.');return mime;
}
function dimensions(width:number,height:number){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>32768||height>32768||width*height>MAX_PIXELS)throw Error('Image dimensions exceed the local preview limit: 40 million pixels and 32,768 per side. Ask the team to prepare it.');return {width,height};}
/** Header preflight before browser Image decode. Unknown/malformed headers fail closed. */
export function rasterDimensions(b:Uint8Array,mime:string){
 const v=new DataView(b.buffer,b.byteOffset,b.byteLength),ascii=(i:number,n:number)=>String.fromCharCode(...b.slice(i,i+n));
 if(mime==='image/png'){
  if(b.length<33||ascii(1,3)!=='PNG'||b[0]!==137||ascii(12,4)!=='IHDR'||v.getUint32(8)!==13||b[4]!==13||b[5]!==10||b[6]!==26||b[7]!==10)throw Error('Invalid PNG header.');
  return dimensions(v.getUint32(16),v.getUint32(20));
 }
 if(mime==='image/jpeg'){
  if(b.length<4||b[0]!==255||b[1]!==216)throw Error('Invalid JPEG header.');
  let i=2;while(i+4<=Math.min(b.length,1048576)){
   if(b[i++]!==255)break;while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;
   if(marker===1||(marker>=208&&marker<=215))continue;
   if(i+2>b.length)break;const size=v.getUint16(i);if(size<2||i+size>b.length)break;
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(size<8)break;return dimensions(v.getUint16(i+5),v.getUint16(i+3));}i+=size;
  }throw Error('JPEG dimensions could not be verified before decoding. Ask the team to prepare it.');
 }
 if(mime==='image/webp'){
  if(b.length<25||ascii(0,4)!=='RIFF'||ascii(8,4)!=='WEBP'||v.getUint32(4,true)+8!==b.length)throw Error('Invalid WebP header.');
  const kind=ascii(12,4),size=v.getUint32(16,true);if(size+20>b.length)throw Error('Truncated WebP header.');
  const u24=(i:number)=>b[i]+256*b[i+1]+65536*b[i+2];
  if(kind==='VP8X'&&size>=10&&b.length>=30){if(b[20]&2)throw Error('Animated WebP needs team preparation.');return dimensions(u24(24)+1,u24(27)+1);}
  if(kind==='VP8L'&&size>=5&&b[20]===47){const bits=v.getUint32(21,true);return dimensions((bits&16383)+1,((bits>>>14)&16383)+1);}
  if(kind==='VP8 '&&size>=10&&b.length>=30&&b[23]===157&&b[24]===1&&b[25]===42)return dimensions(v.getUint16(26,true)&16383,v.getUint16(28,true)&16383);
  throw Error('Unsupported WebP header. Ask the team to prepare it.');
 }throw Error('Unsupported raster type.');
}
const asData=(b:Uint8Array,mime:string)=>{let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));return `data:${mime};base64,${btoa(s)}`;};
export async function prepareArtwork(name:string,bytes:Uint8Array,parse:(s:string)=>Document,decode:(url:string)=>Promise<{width:number;height:number}>):Promise<Artwork>{
 if(!bytes.length||bytes.length>MAX_ART_BYTES)throw Error('Choose nonempty artwork up to 15 MiB.');
 const mime=artworkMime(name);let header:{width:number;height:number}|undefined;
 if(['image/png','image/jpeg','image/webp'].includes(mime))header=rasterDimensions(bytes,mime);
 const original=asData(bytes,mime);let result:Artwork={name,original,width:1,height:1,suggestions:[],excluded:0};
 if(mime==='image/svg+xml'){
  try{const a=analyzeVector(new TextDecoder().decode(bytes),parse);result={...result,...a,preview:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(a.svg)};}
  catch(e){result.fallback=e instanceof Error?e.message:'Team preparation required';}
 }else if(header){
  const actual=await decode(original);dimensions(actual.width,actual.height);
  // EXIF orientation may swap dimensions, without changing the resource bound.
  if(!((actual.width===header.width&&actual.height===header.height)||(actual.width===header.height&&actual.height===header.width)))throw Error('Decoded dimensions disagree with the image header.');
  result={...result,...actual,preview:original,fallback:'We can fit this image. The team will identify raised areas; bitmap silhouette tracing is not available here.'};
 }else result.fallback='PDF and AI need a team-prepared preview. Your original file is retained unchanged in this local review.';
 return result;
}
type CatalogProduct={id:string;shape:string;dimensions:{width:number;height:number}};
export type ReopenedPacket={productId:string;art:Artwork;choice:string;selected:string[];notes:string};
const object=(x:unknown):Record<string,unknown>=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid review packet structure.');return x as Record<string,unknown>;};
export async function reopenPacket(text:string,products:CatalogProduct[],parse:(s:string)=>Document,decode:(url:string)=>Promise<{width:number;height:number}>):Promise<ReopenedPacket>{
 if(text.length>MAX_PACKET_BYTES)throw Error('Review packet exceeds 22 MiB.');
 const p=object(JSON.parse(text)),product=object(p.product),original=object(p.original);
 const current=products.find(x=>x.id===product.id);
 if(p.version!==1||!current||product.shape!==current.shape||product.width!==current.dimensions.width||product.height!==current.dimensions.height)throw Error('Packet product or version is unavailable or has changed.');
 if(typeof original.name!=='string'||typeof original.data!=='string'||typeof p.notes!=='string'||p.notes.length>2000||!['suggested','flat','team'].includes(String(p.embossPreference))||!Array.isArray(p.selectedRegions)||p.selectedRegions.length>6||p.selectedRegions.some(x=>typeof x!=='string'||!/^region-\d{1,3}$/.test(x))||new Set(p.selectedRegions).size!==p.selectedRegions.length||p.productionApproval!=='unapproved'||p.delivery!=='local-only-not-submitted')throw Error('Invalid review packet fields.');
 const comma=original.data.indexOf(','),prefix=original.data.slice(0,comma),encoded=original.data.slice(comma+1);
 const mime=artworkMime(original.name);
 if(comma<0||!prefix.startsWith('data:')||!prefix.endsWith(';base64')||![`data:${mime};base64`,'data:application/octet-stream;base64','data:;base64'].includes(prefix)||!encoded.length||encoded.length>4*Math.ceil(MAX_ART_BYTES/3)||encoded.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Error('Packet artwork must be bounded embedded file bytes; external references are not accepted.');
 const raw=atob(encoded);if(raw.length>MAX_ART_BYTES)throw Error('Packet artwork exceeds 15 MiB.');
 const art=await prepareArtwork(original.name,Uint8Array.from(raw,c=>c.charCodeAt(0)),parse,decode);
 const selected=p.selectedRegions as string[];
 if(selected.some(id=>!art.suggestions.some(s=>s.id===id)))throw Error('Packet raised-area selections do not match the revalidated artwork.');
 // Never restore imported approval, fit, SVG markup or rendered previews.
 return {productId:current.id,art,choice:String(p.embossPreference),selected,notes:p.notes};
}
