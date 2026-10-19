const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
test('password setup form strips fragment, rejects mismatch and clears secrets after submission',async()=>{
 const token='a'.repeat(43),dom=new JSDOM('<div id="root"></div>',{url:'https://www.customtintackers.com/wholesale/password/set#token='+token});
 for(const k of ['window','document','HTMLElement','HTMLInputElement','Node','Event','MouseEvent'])global[k]=dom.window[k];global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');global.React=React;
 const Page=require('../src/app/wholesale/password/set/page.tsx').default,root=createRoot(document.getElementById('root')),prior=global.fetch;let submissions=0;
 global.fetch=async(url,options)=>{submissions++;assert.equal(url,'/api/distributor-password/complete');assert.deepEqual(JSON.parse(options.body),{token,password:'a long synthetic password'});return {ok:true,json:async()=>({ok:true})};};
 const set=async(id,value)=>{await act(async()=>{const el=document.getElementById(id);Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});};
 const submit=async()=>act(async()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 try{await act(async()=>root.render(React.createElement(Page)));assert.equal(window.location.hash,'');assert.equal(window.localStorage.length,0);await set('new-password','a long synthetic password');await set('confirm-password','a different password');await submit();assert.equal(submissions,0);assert.match(document.body.textContent,/Passwords must match/);await set('confirm-password','a long synthetic password');await submit();assert.equal(submissions,1);assert.match(document.body.textContent,/Your password is set/);assert.equal(document.querySelector('input[type=password]'),null);assert.equal(window.sessionStorage.length,0);}finally{await act(async()=>root.unmount());global.fetch=prior;dom.window.close();}
});
