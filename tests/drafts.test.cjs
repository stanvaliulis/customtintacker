const { test } = require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const { createRoot }=require('react-dom/client');
const { JSDOM }=require('jsdom');
const { useDesignDraft }=require('../src/hooks/useDesignDraft.ts');
const { useDesignHistory }=require('../src/hooks/useDesignHistory.ts');
const { draftKey: baseDraftKey, createDocument }=require('../src/lib/design/document.ts');
const { designerConfig }=require('../src/data/designer-config.ts');
const draftKey=id=>baseDraftKey(id,designerConfig.storageNamespace);
const { validateCanvas }=require('../src/lib/design/document.ts');
const { serializeCanvasSelection }=require('../src/hooks/useDesignCanvas.ts');
const { act }=React;
const product={id:'test-sign',shape:'square',width:12,height:12};

test('clipboard carries independent selected document objects rather than a transient ActiveSelection',()=>{
  const background={},first={},guide={excludeFromExport:true},second={},unselected={};
  // Fabric Canvas.toObject supplies absolute coordinates, including selection transforms.
  const world=[{type:'Rect',left:0,top:0},{type:'Rect',left:40,top:70},{type:'Textbox',left:180,top:70,text:'Editable'},{type:'Circle',left:400,top:90}];
  const canvas={getActiveObjects:()=>[first,second],getObjects:()=>[background,first,guide,second,unselected],toObject:()=>({objects:world})};
  const objects=JSON.parse(serializeCanvasSelection(canvas));
  assert.deepEqual(objects,[world[1],world[2]]);
  assert.doesNotThrow(()=>validateCanvas({objects}));
  assert.equal(objects[1].text,'Editable');assert.equal(objects[1].left,180);
});

async function harness(initial={objects:[]}, stored) {
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost'});
  global.window=dom.window; global.document=dom.window.document; global.localStorage=dom.window.localStorage;
  global.IS_REACT_ACT_ENVIRONMENT=true;
  if(stored) localStorage.setItem(draftKey(product.id),stored);
  let state=initial, draft, history, currentProduct=product;
  const canvas={};
  const serialize=()=>structuredClone(state);
  const restore=async value=>{state=typeof value==='string'?JSON.parse(value):structuredClone(value);};
  function Component() {
    history=useDesignHistory(canvas,serialize,restore);
    draft=useDesignDraft(canvas,currentProduct,serialize,restore,history.resetHistory,{...designerConfig,saveEndpoint:'/test-fixture-save'});
    return null;
  }
  const root=createRoot(document.getElementById('root'));
  await act(async()=>{root.render(React.createElement(Component));});
  return { get draft(){return draft;},get history(){return history;},get state(){return state;}, set state(s){state=s;},
    switchProduct:async value=>{currentProduct=value;await act(async()=>root.render(React.createElement(Component)));},
    cleanup:async()=>{await act(async()=>root.unmount());dom.window.close();} };
}

test('device recovery, blank undo and redo preserve exact snapshots',async()=>{
  const saved=createDocument(product,{objects:[{type:'textbox',text:'Saved words'}]});
  const h=await harness(undefined,JSON.stringify(saved));
  try {
    assert.equal(h.state.objects[0].text,'Saved words');
    assert.equal(h.history.canUndo,false);
    await act(async()=>{h.state={objects:[]};h.history.saveState();h.draft.persist();});
    assert.equal(h.history.canUndo,true);
    await act(async()=>h.history.undo()); assert.equal(h.state.objects[0].text,'Saved words');
    await act(async()=>h.history.redo()); assert.deepEqual(h.state.objects,[]);
    await act(async()=>h.draft.persist());
    assert.deepEqual(JSON.parse(localStorage.getItem(draftKey(product.id))).canvas.objects,[]);
  }finally{await h.cleanup();}
});

test('a save completing after navigation cannot replace the device draft with a disposed canvas',async()=>{
  const h=await harness({objects:[{type:'textbox',text:'Keep after leaving'}]});
  const original=global.fetch;let resolve, pending;
  global.fetch=()=>new Promise(r=>{resolve=r;});
  const storage=global.localStorage;
  try {
    await act(async()=>{pending=h.draft.saveOnline();});
    await h.cleanup();h.state={objects:[]};
    let id;await act(async()=>{resolve({ok:true,json:async()=>({id:'late-receipt'})});id=await pending;});
    assert.equal(id,null);
    assert.equal(JSON.parse(storage.getItem(draftKey(product.id))).canvas.objects[0].text,'Keep after leaving');
  }finally{global.fetch=original;}
});

test('changing products invalidates old receipts even for identical artwork',async()=>{
  const h=await harness({objects:[]});
  const original=global.fetch;let count=0;
  global.fetch=async()=>({ok:true,json:async()=>({id:'receipt-'+(++count)})});
  try {
    let oldId,newId;await act(async()=>{oldId=await h.draft.saveOnline();});
    await h.switchProduct({...product,id:'another-product'});
    await act(async()=>{newId=await h.draft.saveOnline();});
    assert.notEqual(oldId,newId);assert.equal(count,2);
  }finally{global.fetch=original;await h.cleanup();}
});

test('draft storage and online payload include only artwork and product/session fields',async()=>{
  const h=await harness({objects:[{type:'textbox',text:'Synthetic artwork'}]});
  const original=global.fetch;let payload;
  localStorage.setItem('unrelated-checkout',JSON.stringify({email:'test@example.invalid',address:'Synthetic address'}));
  global.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({id:'safe-test-receipt'})};};
  try {
    await act(async()=>{await h.draft.saveOnline();});
    assert.deepEqual(Object.keys(payload).sort(),['canvasJson','height','productId','sessionId','shape','width']);
    const doc=JSON.parse(localStorage.getItem(draftKey(product.id)));
    assert.deepEqual(Object.keys(doc).sort(),['canvas','product','serverId','updatedAt','version']);
    assert.doesNotMatch(JSON.stringify(doc)+JSON.stringify(payload),/test@example|Synthetic address|unrelated-checkout/);
  }finally{global.fetch=original;await h.cleanup();}
});
test('failed server save does not claim success and keeps the editable device copy',async()=>{
  const h=await harness({objects:[{type:'textbox',text:'Keep me'}]});
  const original=global.fetch;global.fetch=async()=>({ok:false});
  try {
    let id;await act(async()=>{id=await h.draft.saveOnline();});
    assert.equal(id,null);assert.equal(h.draft.status,'error');
    assert.equal(JSON.parse(localStorage.getItem(draftKey(product.id))).canvas.objects[0].text,'Keep me');
  }finally{global.fetch=original;await h.cleanup();}
});
test('repeated save uses one request and stale completion does not link newer artwork',async()=>{
  const h=await harness({objects:[{type:'textbox',text:'Old'}]});
  const original=global.fetch;let resolve,calls=0;
  global.fetch=()=>{calls++;return new Promise(r=>{resolve=r;});};
  try {
    let first,second;
    await act(async()=>{first=h.draft.saveOnline();second=h.draft.saveOnline();});
    assert.equal(calls,1);assert.equal(first,second);
    h.state={objects:[{type:'textbox',text:'New'}]};
    let id;
    await act(async()=>{resolve({ok:true,json:async()=>({id:'test-receipt'})});id=await first;});
    assert.equal(id,null);assert.equal(h.draft.status,'local');
    const doc=JSON.parse(localStorage.getItem(draftKey(product.id)));
    assert.equal(doc.canvas.objects[0].text,'New');assert.equal(doc.serverId,undefined);
  }finally{global.fetch=original;await h.cleanup();}
});
test('successful online receipt persists with the matching device snapshot',async()=>{
  const h=await harness({objects:[{type:'textbox',text:'Final'}]});
  const original=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({id:'saved-test-only'})});
  try {
    let id;await act(async()=>{id=await h.draft.saveOnline();});
    assert.equal(id,'saved-test-only');assert.equal(h.draft.status,'saved');
    assert.equal(JSON.parse(localStorage.getItem(draftKey(product.id))).serverId,id);
  }finally{global.fetch=original;await h.cleanup();}
});
test('storage quota failure is visible and a malformed previous draft is preserved',async()=>{
  const h=await harness(undefined,'{broken');
  try {
    assert.equal(h.draft.status,'error');
    h.state={objects:[{type:'textbox',text:'Replacement'}]};
    await act(async()=>h.draft.persist());
    assert.equal(localStorage.getItem(draftKey(product.id)+':recovery'),'{broken');
    const storagePrototype=Object.getPrototypeOf(localStorage), old=storagePrototype.setItem;
    storagePrototype.setItem=()=>{throw new Error('QuotaExceededError');};
    try {await act(async()=>h.draft.persist());assert.equal(h.draft.status,'error');assert.match(h.draft.message,/storage/i);}
    finally{storagePrototype.setItem=old;}
  }finally{await h.cleanup();}
});
