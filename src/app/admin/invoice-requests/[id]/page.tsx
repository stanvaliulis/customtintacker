import {staffInvoice} from '@/lib/persistence/staff-invoice';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export default async function InvoiceReview({params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated()))redirect('/admin/login');
 const {id}=await params,order=await staffInvoice(id);
 return <section className="mx-auto max-w-4xl space-y-5 p-6">
  <h1 className="text-2xl font-bold">Unpaid invoice request</h1>
  <p>{order.id} · Interstate Graphics</p>
  <p>No invoice has been sent, no payment taken and no production approval granted. Review artwork, shipping and tax before issuing an invoice.</p>
  <p>{order.customerName} · {order.customerEmail}</p>
  <pre className="whitespace-pre-wrap">{JSON.stringify(order.details,null,2)}</pre>
  <p>Estimated subtotal: ${(order.estimate.subtotal/100).toFixed(2)}. Shipping, tax and final total pending staff review.</p>
  <ul className="space-y-4">{order.sources.map(source=><li key={source.revisionId} className="rounded border p-4">
   <p>{source.designId}</p><p className="break-all text-sm">Source SHA-256: {source.sourceHash}</p>
   <a className="mr-5 underline" href={'/api/admin/invoice-artwork?'+new URLSearchParams({order_id:id,source_id:source.revisionId,kind:'document'})}>Download saved source</a>
   <a className="underline" href={'/api/admin/invoice-artwork?'+new URLSearchParams({order_id:id,source_id:source.revisionId,kind:'original'})}>Download original upload (if supplied)</a>
  </li>)}</ul>
 </section>;
}
