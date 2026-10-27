import Link from 'next/link';
export default function StaffShippingNotice(){return <section className="mt-6 border-t pt-4" aria-label="Staff shipping quote">
 <h3 className="font-semibold">Shipping quoted by our team</h3>
 <p className="text-sm mt-2">Enter your US delivery address on the next page. We will review the products, quantities and packing, then confirm shipping and tax for your approval before payment.</p>
 <p className="text-sm mt-2 font-medium">Shipping: quote required — not included in the subtotal.</p>
 <p className="text-xs mt-2">Mixed sizes, custom shapes, large orders, Alaska, Hawaii, territories and special-delivery addresses receive individual review. No automatic shipping charge or free-shipping assumption.</p>
 <Link href="/quote" className="text-sm underline">Need an international or special-delivery quote?</Link>
 </section>;}
