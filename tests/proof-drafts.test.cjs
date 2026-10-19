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

async function harness(initial={objects:[]}, stored, restoreTransform=value=>value) {
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost'});
  global.window=dom.window; global.document=dom.window.document; global.localStorage=dom.window.localStorage;
  global.IS_REACT_ACT_ENVIRONMENT=true;
  if(stored) localStorage.setItem(draftKey(product.id),stored);
  let state=initial, draft, history, currentProduct=product;
  const canvas={};
  const serialize=()=>structuredClone(state);
  const restore=async value=>{state=restoreTransform(typeof value==='string'?JSON.parse(value):structuredClone(value));};
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

test('proof intent recovers from a device draft and survives history and online payload',async()=>{
  const canvas={proofIntent:{version:1,status:'unapproved',preference:'yes'},objects:[{type:'Rect',proofId:'durable-shape',embossRequested:true,width:20,height:20}]};
  const h=await harness(undefined,JSON.stringify(createDocument(product,canvas)));
  const original=global.fetch; let payload;
  global.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({id:'intent-receipt'})};};
  try {
    assert.equal(h.state.objects[0].embossRequested,true);
    await act(async()=>{h.state={...canvas,objects:[]};h.history.saveState();h.draft.persist();});
    await act(async()=>{await h.history.undo();h.draft.persist();});
    assert.equal(h.state.objects[0].proofId,'durable-shape');
    await act(async()=>h.draft.saveOnline());
    assert.deepEqual(JSON.parse(payload.canvasJson),canvas);
    assert.deepEqual(JSON.parse(localStorage.getItem(draftKey(product.id))).canvas,canvas);
  }finally{global.fetch=original;await h.cleanup();}
});

test('migrated legacy receipt is not reused until new intent metadata reaches the server',async()=>{
  const legacy=createDocument(product,{objects:[{type:'Rect',width:20,height:20}]},'old-receipt');
  const h=await harness(undefined,JSON.stringify(legacy),value=>({...value,proofIntent:{version:1,status:'unapproved',preference:'unsure'},objects:value.objects.map(o=>({...o,proofId:'migrated-shape'}))}));
  const original=global.fetch;let count=0,payload;
  global.fetch=async(_url,options)=>{count++;payload=JSON.parse(options.body);return {ok:true,json:async()=>({id:'updated-receipt'})};};
  try {
    let id;await act(async()=>{id=await h.draft.saveOnline();});
    assert.equal(count,1);assert.equal(id,'updated-receipt');
    assert.equal(JSON.parse(payload.canvasJson).objects[0].proofId,'migrated-shape');
    assert.equal(JSON.parse(payload.canvasJson).proofIntent.status,'unapproved');
  }finally{global.fetch=original;await h.cleanup();}
});
