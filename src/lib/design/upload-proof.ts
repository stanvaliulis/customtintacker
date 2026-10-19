/** Conservative local vector analysis. Never traces bitmap pixels or approves tooling. */
export type Suggestion={id:string;label:string;markup:string};
export function fitArtwork(w:number,h:number,pw:number,ph:number,round=false){
 if(![w,h,pw,ph].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid artwork dimensions');
 const inset=round?0.62:0.88,scale=Math.min(pw*inset/w,ph*inset/h);
 return {x:(pw-w*scale)/2,y:(ph-h*scale)/2,width:w*scale,height:h*scale};
}
export function analyzeVector(source:string,parse:(s:string)=>Document){
 if(source.length>2000000||/<!DOCTYPE|<!ENTITY/i.test(source))throw Error('This SVG needs team preparation.');
 const doc=parse(source),root=doc.documentElement;
 if(root.localName!=='svg'||doc.querySelector('parsererror'))throw Error('Cannot read this SVG.');
 const vb=(root.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
 if(vb.length!==4||!vb.every(Number.isFinite)||vb[2]<=0||vb[3]<=0)throw Error('SVG needs a valid viewBox.');
 const nodes=[...root.querySelectorAll('*')];if(nodes.length>300)throw Error('Detailed vector artwork needs team preparation.');
 const allowed=new Set(['svg','g','path','rect','circle','ellipse','polygon','title','desc']);
 const attrs=new Set(['xmlns','viewBox','width','height','id','fill','stroke','stroke-width','d','x','y','rx','ry','cx','cy','r','points','fill-rule']);
 for(const el of [root,...nodes]){
  if(!allowed.has(el.localName))throw Error('This SVG uses text, effects, or linked artwork that needs team preparation.');
  if(el!==root&&el.localName==='svg')throw Error('Nested SVG needs team preparation.');
  for(const a of [...el.attributes])if(!attrs.has(a.name)||/url\s*\(|[<>]/i.test(a.value))throw Error('This SVG uses unsupported styling or references. The team can prepare it.');
 }
 const suggestions:Suggestion[]=[];let excluded=0;
 for(const [index,el] of nodes.entries()){
  if(!['path','rect','circle','ellipse','polygon'].includes(el.localName))continue;
  const parents:Element[]=[];let p:Element|null=el;while(p){parents.push(p);p=p.parentElement;}
  const label=parents.map(n=>n.id).filter(Boolean).join(' ');
  if(/qr|barcode|scan.code/i.test(label)){excluded++;continue;}
  const fill=parents.map(n=>n.getAttribute('fill')).find(v=>v!==null)||'black';
  if(fill==='none'||/background|border|cut|die|guide/i.test(label))continue;
  const num=(a:string)=>Number(el.getAttribute(a)||0);
  const area=el.localName==='rect'?num('width')*num('height'):el.localName==='circle'?Math.PI*num('r')**2:el.localName==='ellipse'?Math.PI*num('rx')*num('ry'):null;
  if(area!==null&&(area/(vb[2]*vb[3])<0.01||area/(vb[2]*vb[3])>0.65))continue;
  if(area===null&&!/logo|brand|letter|mark|badge/i.test(label))continue;
  const clone=el.cloneNode(true) as Element;clone.setAttribute('fill','#22c55e');clone.setAttribute('stroke','none');
  const rule=parents.map(n=>n.getAttribute('fill-rule')).find(Boolean);if(rule)clone.setAttribute('fill-rule',rule);
  suggestions.push({id:`region-${index}`,label:el.id||`Artwork shape ${suggestions.length+1}`,markup:clone.outerHTML});
 }
 const svg=root.outerHTML;
 return {svg,viewBox:vb.join(' '),width:vb[2],height:vb[3],suggestions:suggestions.slice(0,6),excluded};
}
