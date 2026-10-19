const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
test('actual admin UI selects exact record; cancel never writes; confirmation submits once',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/admin/distributors?application=synthetic-target'});
 for(const k of ['window','document','HTMLElement','Node','Event','MouseEvent'])global[k]=dom.window[k];
 global.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
 global.React=React;
 const Page=require('../src/app/admin/distributors/page.tsx').default;
 const records=[{id:'synthetic-other',companyName:'Other Synthetic',email:'other@example.invalid',contactName:'Other',status:'pending',submittedAt:new Date().toISOString()}, {id:'synthetic-target',companyName:'Target Synthetic',email:'target@example.invalid',contactName:'Target',status:'pending',submittedAt:new Date().toISOString()}];
 const original=global.fetch;let writes=0;
 global.fetch=async(url,options)=>{if(options?.method==='PATCH'){writes++;assert.ok(url.endsWith('/synthetic-target'));assert.deepEqual(JSON.parse(options.body),{status:'approved',confirmApproval:true});return {ok:true,json:async()=>({status:'approved',notificationQueued:true})};}return {ok:true,json:async()=>records};};
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(Page)));
  const heading=[...document.querySelectorAll('h3')].find(x=>x.textContent==='Target Synthetic');
  const card=heading.closest('.bg-white');assert.ok(card.textContent.includes('Applied:'));assert.equal(writes,0);
  const approve=()=>[...card.querySelectorAll('button')].find(x=>x.textContent.trim()==='Approve');
  await act(async()=>approve().click());assert.ok(document.querySelector('[role="dialog"]').textContent.includes('target@example.invalid'));assert.equal(writes,0);
  await act(async()=>[...document.querySelectorAll('[role="dialog"] button')].find(x=>x.textContent==='Cancel').click());assert.equal(writes,0);assert.equal(document.querySelector('[role="dialog"]'),null);
  await act(async()=>approve().click());
  await act(async()=>[...document.querySelectorAll('[role="dialog"] button')].find(x=>x.textContent==='Confirm approval').click());
  assert.equal(writes,1);assert.ok(document.body.textContent.includes('account remains locked until setup is complete'));assert.equal(document.querySelector('[role="dialog"]'),null);
 }finally{await act(async()=>root.unmount());global.fetch=original;dom.window.close();}
});
