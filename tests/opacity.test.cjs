const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');
const {createRoot}=require('react-dom/client');
const {Rect}=require('fabric');
const {createDocument,parseDocument,draftKey}=require('../src/lib/design/document.ts');
const {designerConfig}=require('../src/data/designer-config.ts');
const {act}=React;
const product={id:'synthetic-opacity',shape:'square',width:12,height:12};

// Exercise the real editor, properties panel, history and draft hooks. Only the
// browser canvas surface and unrelated panels are substituted. No customer data.
async function harness(stored) {
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 if(stored)localStorage.setItem(draftKey(product.id,designerConfig.storageNamespace),stored);
 let object=new Rect({width:100,height:100,fill:'#ff0000'}),toolbar,renders=0,request;
 const events=new Map();
 const fire=name=>{for(const fn of events.get(name)||[])fn({target:object});};
 const canvas={on(n,f){if(!events.has(n))events.set(n,new Set());events.get(n).add(f);},off(n,f){events.get(n)?.delete(f);},getActiveObject:()=>object,getObjects:()=>[object],requestRenderAll(){renders++;},setActiveObject(o){object=o;fire('selection:created');}};
 const toJSON=()=>({version:'6.0.0',objects:[object.toObject()]});
 const loadFromJSON=async data=>{const value=typeof data==='string'?JSON.parse(data):data;object=await Rect.fromObject(value.objects[0]);fire('selection:updated');};
 const hook={canvas,zoom:1,toJSON,loadFromJSON};
 for(const name of ['addText','addImage','addShape','deleteSelected','selectAll','copySelected','pasteFromClipboard','duplicateSelected','bringToFront','sendToBack','bringForward','sendBackward','nudgeSelected','zoomIn','zoomOut','fitToScreen','exportPNG','exportSVG','exportPrintReady'])hook[name]=()=>{};
 const compile=relative=>{const file=path.resolve(__dirname,'../src/components/design',relative);const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;};
 const original=Module._load,oldFetch=global.fetch;
 Module._load=function(id,parent,main){if(id==='@/context/CartContext')return {useCart:()=>({items:[],attachDesign(){}})};if(id==='@/hooks/useDesignCanvas')return {useDesignCanvas:()=>hook};if(id==='./DesignToolbar')return {__esModule:true,default:p=>{toolbar=p;return null;}};if(id==='./DesignSidebar')return {__esModule:true,default:()=>null};if(id==='./DesignProperties')return compile('DesignProperties.tsx');if(id==='sonner')return {toast:{success(){},error(){},info(){}}};return original.call(this,id,parent,main);};
 let Editor;try{Editor=compile('DesignEditor.tsx').default;}finally{Module._load=original;}
 global.fetch=async(_url,options)=>{if(_url==='/api/artwork/session')return {ok:true};request=JSON.parse(options.body);return {ok:true,json:async()=>({id:'synthetic-opacity-receipt'})};};
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(React.createElement(Editor,{productId:product.id,productName:'Synthetic',shape:product.shape,width:12,height:12,displaySize:'12 x 12'})));
 await act(async()=>fire('selection:created'));
 const slider=()=>document.querySelector('input[type="range"]');
 return {get object(){return object;},get toolbar(){return toolbar;},get renders(){return renders;},get request(){return request;},slider,toJSON,
  change:async value=>{await act(async()=>{const input=slider();const props=input[Object.keys(input).find(k=>k.startsWith('__reactProps$'))];props.onChange({target:{value:String(value)}});});},
  reopen:async value=>{await act(async()=>loadFromJSON(value));},
  raw:()=>localStorage.getItem(draftKey(product.id,designerConfig.storageNamespace)),
  cleanup:async()=>{await act(async()=>root.unmount());global.fetch=oldFetch;dom.window.close();}};
}

test('opacity UI percent maps once to Fabric render, history, device save and online save at all endpoints',async()=>{
 const h=await harness();
 try {
  assert.equal(h.slider().value,'100');assert.match(h.slider().parentElement.textContent,/100%/);
  for(const percent of [0,1,50,99,100]) {
   const before=h.object.opacity,renderBefore=h.renders;
   await h.change(percent);
   assert.equal(h.object.opacity,percent/100);assert.ok(h.renders>renderBefore);
   assert.equal(h.slider().value,String(percent));assert.equal(h.slider().getAttribute('aria-valuetext'),percent+'%');
   assert.match(h.object.toSVG(),new RegExp('opacity: '+String(percent/100).replace('.','\\.')+';'));
   assert.equal(JSON.parse(h.raw()).canvas.objects[0].opacity,percent/100);
   const backup=parseDocument(JSON.stringify(createDocument(product,h.toJSON())),product);
   await h.reopen(backup.canvas);assert.equal(h.object.opacity,percent/100);
   await act(async()=>h.toolbar.onUndo());assert.equal(h.object.opacity,before);
   await act(async()=>h.toolbar.onRedo());assert.equal(h.object.opacity,percent/100);
   await act(async()=>h.toolbar.onSave());assert.equal(JSON.parse(h.request.canvasJson).objects[0].opacity,percent/100);
   const raw=h.raw();await h.reopen(parseDocument(raw,product).canvas);assert.equal(h.object.opacity,percent/100);
  }
 }finally{await h.cleanup();}
});

test('legacy and current documents preserve exact existing opacity, including intentionally tiny values',async()=>{
 // Fabric serializes numeric properties to four decimals by default. Keep that
 // existing format; do not infer percent units from tiny legitimate fractions.
 for(const value of [undefined,0,0.01,0.5,0.99,1,0.0099,0.1234]) {
  const canvas={objects:[{type:'Rect',width:100,height:100,...(value===undefined?{}:{opacity:value})}]};
  for(const raw of [JSON.stringify(canvas),JSON.stringify(createDocument(product,canvas))]) {
   const before=JSON.stringify(canvas);const parsed=parseDocument(raw,product);assert.equal(JSON.stringify(parsed.canvas),before);
   const h=await harness(raw);
   try {
    assert.equal(h.object.opacity,value??1);assert.equal(h.slider().value,String(Math.round((value??1)*100)));
    await act(async()=>h.toolbar.onSave());assert.equal(JSON.parse(h.request.canvasJson).objects[0].opacity,value??1);
    assert.equal(parseDocument(h.raw(),product).canvas.objects[0].opacity,value??1);
   }finally{await h.cleanup();}
  }
 }
});
