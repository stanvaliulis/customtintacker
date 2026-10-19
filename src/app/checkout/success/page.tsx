import Link from 'next/link';
/** A legacy payment redirect alone is not proof of payment. Invoice requests confirm inline. */
export default function CheckoutSuccessPage(){
 return <section className="max-w-xl mx-auto py-16 px-6 text-center">
  <h1 className="text-2xl font-bold">Check your order confirmation</h1>
  <p className="my-5">This page does not verify payment or approve production. Your cart has been kept. If you completed a card payment, contact Interstate Graphics to confirm its status before paying again.</p>
  <p><Link className="underline" href="/contact">Contact Interstate Graphics</Link></p>
  <p className="mt-5"><Link href="/cart">Return to cart</Link></p>
 </section>;
}
