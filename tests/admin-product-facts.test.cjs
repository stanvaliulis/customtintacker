const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),Module=require('module');
test('actual product admin form preserves variant specifications and explicit zero values; new material needs explicit choice',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.invalid/admin/products'});
 for(const k of ['window','document','HTMLElement','HTMLInputElement','Node','Event','MouseEvent'])global[k]=dom.window[k];global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');global.React=React;
 const original=Module._load;Module._load=function(id,p,m){if(id==='next/navigation')return {useRouter:()=>({push(){},refresh(){}})};if(p?.filename.endsWith('ProductForm.tsx')&&['./PricingTierEditor','./ImageUploader'].includes(id))return {__esModule:true,default:()=>null};return original.call(this,id,p,m);};
 let Form;try{Form=require('../src/components/admin/ProductForm.tsx').default;}finally{Module._load=original;}
 const root=createRoot(document.getElementById('root')),prior=global.fetch,requests=[];global.fetch=async(url,opts)=>{requests.push({url,method:opts.method,body:JSON.parse(opts.body)});return {ok:true};};
 const base={id:'synthetic',slug:'synthetic',name:'Synthetic',shortDescription:'Flat sign',longDescription:'Custom material',category:'standard',shape:'square',width:12,height:12,displaySize:'12 inch',wholesaleDiscount:.4,minimumOrder:50,leadTimeDays:15,setupFee:0,inStock:true,featured:false,sortOrder:0,mountingHoles:0,shrinkWrapped:false,madeInUSA:false,images:[],pricingTiers:[],backingOptions:[{backingId:'standard-024'}],features:[{text:'Not embossed',sortOrder:0}]};
 const submit=async()=>act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 try{
 for(const [i,variant]of [{material:'Embossed Vinyl',printMethod:'Full Color Digital Print'},{material:'.024-inch aluminum, white on both sides',printMethod:'Direct print'},{material:'Customer-specified composite',printMethod:'Special surface process'}].entries()){
 await act(async()=>root.render(React.createElement(Form,{key:i,initialData:{...base,...variant}})));await submit();const r=requests.at(-1);assert.equal(r.method,'PUT');assert.equal(r.body.material,variant.material);assert.equal(r.body.printMethod,variant.printMethod);assert.equal(r.body.mountingHoles,0);assert.equal(r.body.setupFee,0);assert.equal(r.body.madeInUSA,false);assert.deepEqual(r.body.features,['Not embossed']);assert.equal(document.querySelectorAll('button').length>0,true);
 }
 await act(async()=>root.render(React.createElement(Form,{key:'new'})));const count=requests.length;assert.equal(document.getElementById('product-material').value,'');await submit();assert.equal(requests.length,count);assert.match(document.body.textContent,/Enter the material and print method/);
 const preset=[...document.querySelectorAll('button')].find(b=>b.textContent==='Use standard aluminum specifications');await act(async()=>preset.click());await submit();const body=requests.at(-1).body;assert.equal(body.material,'.024-inch aluminum, white on both sides');assert.equal(body.printMethod,'Direct print');assert.deepEqual(body.features,[]);
 }finally{await act(async()=>root.unmount());global.fetch=prior;dom.window.close();}
});
