import {getAllProducts} from '@/lib/products';
import UploadProof from '@/components/design/UploadProof';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {uploadTitle,uploadDescription,uploadAnswers,selectUploadProduct} from '@/lib/design/upload-content';
export const metadata:Metadata={title:uploadTitle,description:uploadDescription,alternates:{canonical:'https://www.customtintackers.com/upload-proof'},openGraph:{title:uploadTitle,description:uploadDescription,url:'https://www.customtintackers.com/upload-proof',type:'website'},twitter:{card:'summary_large_image',title:uploadTitle,description:uploadDescription}};
export default async function Page({searchParams}:{searchParams:Promise<{product?:string|string[]}>}){
 const products=await getAllProducts(),query=await searchParams;
 const productId=selectUploadProduct(query.product,products);if(!productId)notFound();
 return <><UploadProof key={productId} products={products} initialProductId={productId}/><section aria-label="Upload and emboss answers" className="bg-slate-50 text-slate-900 px-5 pb-12"><div className="max-w-6xl mx-auto border-t pt-8"><h2 className="text-2xl font-bold">Before you upload</h2><dl className="grid md:grid-cols-2 gap-6 mt-6">{uploadAnswers.map(a=><div key={a.question}><dt className="font-semibold">{a.question}</dt><dd className="mt-2 text-slate-600">{a.answer}</dd></div>)}</dl><Link className="inline-block underline text-teal-800 mt-6 min-h-11" href="/artwork-templates">Artwork guides and file requirements</Link></div></section></>;
}
