import Link from 'next/link';
import {redirect} from 'next/navigation';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {staffInvoiceRequests} from '@/lib/persistence/staff-invoice';
export const dynamic='force-dynamic';
export default async function Requests({searchParams}:{searchParams:Promise<{page?:string}>}){
 if(!(await isAdminAuthenticated()))redirect('/admin/login');
 const raw=(await searchParams).page,page=raw&&/^\d+$/.test(raw)?Number(raw):1;
 let data:Awaited<ReturnType<typeof staffInvoiceRequests>>;
 try{data=await staffInvoiceRequests(page);}catch{return <section className="p-6"><h1>Shipping &amp; invoice requests</h1><p>Request list unavailable. Check workflow configuration before accepting requests.</p></section>;}
 return <section className="p-6 space-y-4"><h1 className="text-2xl font-bold">Shipping &amp; invoice requests</h1>
 <p>Review destinations, artwork and packing, then confirm shipping and tax with the customer. These are submitted request snapshots, not a live payment or fulfillment status list. Order email settings are unchanged; monitor this list while notifications are off.</p>
 {!data.orders.length&&<p>No requests on this page.</p>}
 <ul>{data.orders.map(o=><li key={o.id} className="border rounded p-3 my-2"><Link className="underline" href={'/admin/invoice-requests/'+encodeURIComponent(o.id)}>{o.customerName} — {o.id}</Link><p>{[o.details.city,o.details.state,o.details.zip].filter(Boolean).join(', ')||'Destination missing: follow up before final pricing.'}</p><p>Submitted subtotal ${(o.estimate.subtotal/100).toFixed(2)}; see reviewed record for final amounts.</p></li>)}</ul>
 <nav className="flex gap-4">{page>1&&<Link href={'?page='+(page-1)}>Previous page</Link>}{data.hasMore&&<Link href={'?page='+(page+1)}>Next page</Link>}</nav></section>;
}
