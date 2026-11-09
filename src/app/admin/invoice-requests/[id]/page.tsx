import {staffInvoice} from '@/lib/persistence/staff-invoice';
import {isAdminAuthenticated} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
import PaymentReview from './PaymentReview';
import {paymentReviewGate} from '@/lib/persistence/payments';
export default async function InvoiceReview({params}:{params:Promise<{id:string}>}){
 if(!(await isAdminAuthenticated()))redirect('/admin/login');
 const {id}=await params,order=await staffInvoice(id);
 let paymentReviewAvailable=false;
 try{await paymentReviewGate();paymentReviewAvailable=true;}catch{/* Keep review fail-closed when runtime or schema checks fail. */}
 return <section className="mx-auto max-w-4xl space-y-5 p-6">
  <h1 className="text-2xl font-bold">Invoice request</h1>
  <p>{order.id} · Interstate Graphics</p>
  <p>Review artwork, shipping and tax before issuing an invoice or approving final payment. Production requires separate staff approval.</p>
  <p>{order.customerName} · {order.customerEmail}</p>
  <pre className="whitespace-pre-wrap">{JSON.stringify(order.details,null,2)}</pre>
  <section className="rounded border p-4" aria-label="Shipping review">
   <h2 className="font-semibold">Shipping quote required</h2>
   <p>{order.details.shippingAddress||'Destination not yet supplied — contact customer before final pricing.'}</p>
   <p>{[order.details.city,order.details.state,order.details.zip,order.details.shippingCountry].filter(Boolean).join(', ')}</p>
   <p>Address type: {order.details.shippingAddressType||'Unconfirmed'}</p>
   <p>Confirm actual cartons, gross weights and destination service, then include shipping and tax in the existing final review. Do not treat a missing quote as zero shipping. Changes to this submitted destination require a new reviewed request; do not edit its immutable snapshot.</p>
  </section>
  <p>Estimated subtotal: ${(order.estimate.subtotal/100).toFixed(2)}. Shipping, tax and final total pending staff review.</p>
  <ul className="space-y-4">{order.sources.map(source=><li key={source.revisionId} className="rounded border p-4">
   <p>{source.designId}</p><p className="break-all text-sm">Source SHA-256: {source.sourceHash}</p>
   <a className="mr-5 underline" href={'/api/admin/invoice-artwork?'+new URLSearchParams({order_id:id,source_id:source.revisionId,kind:'document'})}>Download saved source</a>
   <a className="underline" href={'/api/admin/invoice-artwork?'+new URLSearchParams({order_id:id,source_id:source.revisionId,kind:'original'})}>Download original upload (if supplied)</a>
  </li>)}</ul>
  {paymentReviewAvailable?<PaymentReview invoiceId={id} sources={order.sources} subtotal={order.estimate.subtotal} testMode={process.env.VERCEL_ENV!=='production'}/>:<p role="status">Payment review is unavailable. Check the payment configuration and schema before requesting payment.</p>}
 </section>;
}
