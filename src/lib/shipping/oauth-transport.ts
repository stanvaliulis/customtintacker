import 'server-only';
import type {Transport} from './direct-rates';

type Config={carrier:'ups'|'fedex';environment:'sandbox'|'production';clientId:string;clientSecret:string};
type Wire=(url:string,init:RequestInit)=>Promise<Response>;
// No default fetch or env access: composition requires explicit trusted config
// and an injected wire. Tokens stay in this instance's memory, never returned.
export function ratingTransport(config:Config|undefined,wire:Wire,clock=Date.now):Transport {
 let token='',expires=0;
 const fail=()=>new Error('Carrier rating unavailable.');
 return async(path,body,parent)=>{
  if(!config||!config.clientId||!config.clientSecret)throw Error('Carrier rating is not configured.');
  const ups=config.carrier==='ups';
  if(!['ups','fedex'].includes(config.carrier)||!['sandbox','production'].includes(config.environment)||path!==(ups?'/rating/v2409/Shop':'/rate/v1/rates/quotes'))throw fail();
  const host=ups?(config.environment==='sandbox'?'https://wwwcie.ups.com':'https://onlinetools.ups.com'):(config.environment==='sandbox'?'https://apis-sandbox.fedex.com':'https://apis.fedex.com');
  const controller=new AbortController(),abort=()=>controller.abort();
  if(parent.aborted)throw fail();parent.addEventListener('abort',abort,{once:true});
  let timer:ReturnType<typeof setTimeout>|undefined;
  async function json(url:string,headers:Record<string,string>,payload:string,limit:number){
   const response=await wire(url,{method:'POST',headers,body:payload,signal:controller.signal,redirect:'error',cache:'no-store',credentials:'omit'});
   if(!response.ok||!response.headers.get('content-type')?.includes('application/json')){await response.body?.cancel();throw fail();}
   const reader=response.body?.getReader();if(!reader)throw fail();let size=0,text='';const decoder=new TextDecoder();
   try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>limit)throw fail();text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}finally{await reader.cancel().catch(()=>{});}
  }
  const run=async()=>{
   if(!token||clock()>=expires){
    const form=new URLSearchParams({grant_type:'client_credentials'}),headers:Record<string,string>={'content-type':'application/x-www-form-urlencoded'};
    if(ups)headers.Authorization='Basic '+Buffer.from(config.clientId+':'+config.clientSecret).toString('base64');else{form.set('client_id',config.clientId);form.set('client_secret',config.clientSecret);}
    const data=await json(host+(ups?'/security/v1/oauth/token':'/oauth/token'),headers,form.toString(),16384);
    const lifetime=Number(data.expires_in);
    if(typeof data.access_token!=='string'||!data.access_token||data.access_token.length>8192||/[\s\x00-\x1f]/.test(data.access_token)||String(data.token_type).toLowerCase()!=='bearer'||!Number.isFinite(lifetime)||lifetime<=60||lifetime>86400)throw fail();
    if(controller.signal.aborted)throw fail();token=data.access_token;expires=clock()+(lifetime-60)*1000;
   }
   return json(host+(ups?'/api':'')+path,{'content-type':'application/json',Authorization:'Bearer '+token},JSON.stringify(body),1048576);
  };
  try{return await Promise.race([run(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail());},5000);controller.signal.addEventListener('abort',()=>reject(fail()),{once:true});})]);}
  catch{token='';expires=0;throw fail();}
  finally{if(timer)clearTimeout(timer);parent.removeEventListener('abort',abort);controller.abort();}
 };
}
