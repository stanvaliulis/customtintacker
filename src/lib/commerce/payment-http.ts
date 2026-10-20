import {requireSameOrigin,boundedJson} from '../persistence/request-security';
import {failure} from './runtime';
import {CommerceError} from './service';
export interface PaymentActions {
 staffView(id:string):Promise<unknown>; staffAction(id:string,body:Record<string,unknown>):Promise<unknown>;
 customerView(id:string):Promise<unknown>; checkout(id:string):Promise<unknown>; webhook(body:string,signature:string):Promise<unknown>;
}
function invoiceId(value:unknown){if(typeof value!=='string'||!/^[a-f0-9-]{36}$/.test(value))throw new CommerceError('Valid invoice request required.');return value;}
const json=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export function paymentHttp(actions:PaymentActions){return {
 staffGet:async(req:Request)=>{try{return json(await actions.staffView(invoiceId(new URL(req.url).searchParams.get('invoice_id'))));}catch(e){return failure(e);}},
 staffPost:async(req:Request)=>{try{requireSameOrigin(req);const body=await boundedJson(req,3_500_000) as Record<string,unknown>;return json(await actions.staffAction(invoiceId(body.invoiceId),body));}catch(e){return failure(e);}},
 customerGet:async(req:Request)=>{try{return json(await actions.customerView(invoiceId(new URL(req.url).searchParams.get('invoice_id'))));}catch(e){return failure(e);}},
 checkoutPost:async(req:Request)=>{try{requireSameOrigin(req);const body=await boundedJson(req,4096) as Record<string,unknown>;if(Object.keys(body).some(k=>k!=='invoiceId'))throw new CommerceError('Only the invoice reference is accepted.');return json(await actions.checkout(invoiceId(body.invoiceId)));}catch(e){return failure(e);}},
 webhookPost:async(req:Request)=>{try{const signature=req.headers.get('stripe-signature')||'';if(!signature||signature.length>4096||!req.body)throw new CommerceError('Signed payment event required.');const reader=req.body.getReader(),parts:Uint8Array[]=[];let size=0;try{for(;;){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>1024*1024){await reader.cancel();throw new CommerceError('Payment event too large.',413);}parts.push(next.value);}}finally{reader.releaseLock();}const body=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts));return json(await actions.webhook(body,signature));}catch(e){return failure(e);}},
};}
