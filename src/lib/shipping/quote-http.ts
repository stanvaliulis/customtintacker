const headers={'Cache-Control':'private, no-store, max-age=0'};
export function quotePost(run:(req:Request,body:unknown)=>Promise<unknown>){return async(req:Request)=>{
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Same-origin request required.'},{status:403,headers});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'JSON required.'},{status:415,headers});
 try{const reader=req.body?.getReader();if(!reader)throw Error();const chunks:Uint8Array[]=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>4096){await reader.cancel();return Response.json({error:'Request too large.'},{status:413,headers});}chunks.push(r.value);}return Response.json(await run(req,JSON.parse(Buffer.concat(chunks).toString('utf8'))),{headers});}
 catch{return Response.json({status:'shipping-review-required',payable:false,reason:'Unable to verify shipping. Staff review required.'},{status:400,headers});}
 };}
