import {NextResponse} from 'next/server';
import {estimateShipping,EstimateInputError} from '@/lib/shipping/estimate';
import {rateLimit} from '@/lib/spam-protection';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store, max-age=0'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Same-origin request required.'},{status:403,headers});
 const limited=rateLimit(request);if(limited){limited.headers.set('Cache-Control',headers['Cache-Control']);return limited;}
 if(!request.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'JSON required.'},{status:415,headers});
 try{
 const reader=request.body?.getReader();if(!reader)throw new EstimateInputError('Request body required.');const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return NextResponse.json({error:'Request too large.'},{status:413,headers});}chunks.push(value);}
 const result=estimateShipping(JSON.parse(Buffer.concat(chunks).toString('utf8')));return NextResponse.json(result,{headers});
 }catch(error){return NextResponse.json({error:error instanceof EstimateInputError?error.message:'Unable to estimate shipping. Staff review required.'},{status:400,headers});}
}
