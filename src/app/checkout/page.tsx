'use client';

import { useState, useRef } from 'react';

import { useCart } from '@/context/CartContext';
import { useDistributor } from '@/context/DistributorContext';
import { formatPrice } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSpamProtection } from '@/hooks/useSpamProtection';

export default function CheckoutPage() {

  const { items, rushFee, setupFees, total, isDistributor: cartIsDistributor } = useCart();
  const { isDistributor, distributorInfo, distributorDiscount } = useDistributor();
  const { getSpamFields } = useSpamProtection();

  const [form, setForm] = useState({
    name: distributorInfo?.contactName || '',
    email: distributorInfo?.email || '',
    phone: '',
    company: distributorInfo?.companyName || '',
    notes: '',
  });
  const requestKey = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingOrder, setPendingOrder] = useState<string | null>(null);

  function updateField(field: string, value: string) {
    setPendingOrder(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Name and email are required.');
      return;
    }

    if (items.some(i => !i.proofAttachment || i.designId !== i.proofAttachment.designId)) { setError('Review and attach a saved design for every product before continuing.'); return; }
    setLoading(true);
    setError('');

    try {
      const fingerprint = JSON.stringify({ form, items: items.map(i => ({ id: i.product.id, quantity: i.quantity, backing: i.selectedBacking, tier: i.priceTier, rush: i.isRush, design: i.proofAttachment })) });
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
      const storageKey = 'ctt-invoice-attempt:' + Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
      requestKey.current = sessionStorage.getItem(storageKey) || crypto.randomUUID();
      sessionStorage.setItem(storageKey, requestKey.current);
      const res = await fetch('/api/orders/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current },
        body: JSON.stringify({
          ...getSpamFields(),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          company: form.company,
          notes: form.notes,
          isDistributor: isDistributor || cartIsDistributor,
          distributorDiscount: distributorDiscount,
          items: items.map((i) => ({
            productId: i.product.id,
            designId: i.designId,
            proofAttachment: i.proofAttachment,
            quantity: i.quantity,
            backingId: i.selectedBacking,
            priceTier: i.priceTier || 'retail',
            isRush: i.isRush || false,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (data.orderId && data.status === 'invoice-requested' && data.paid === false) {
        setPendingOrder(data.orderId);
      } else {
        setError('Invoice request was not confirmed. Please retry with the same details.');
      }
      setLoading(false);
    } catch {
      setError('Failed to connect. Please try again.');
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="py-16">
        <Container>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Nothing to Check Out</h1>
            <Link href="/products">
              <Button>Shop Products</Button>
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid gap-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-gray-900">{item.product.name}</span>
                    <span className="text-gray-400 ml-1">&times; {item.quantity}</span>
                    <span className="text-gray-400 text-xs ml-2">({formatPrice(item.unitPrice)}/ea)</span>
                    {item.isRush && (
                      <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">RUSH</span>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              {rushFee > 0 && (
                <div className="flex justify-between text-sm py-2 border-t border-gray-100">
                  <span className="text-amber-600">Rush Processing Fee</span>
                  <span className="text-amber-600 font-medium">{formatPrice(rushFee)}</span>
                </div>
              )}
              {setupFees > 0 && (
                <div className="flex justify-between text-sm py-2 border-t border-gray-100">
                  <span className="text-gray-600">Setup Fees</span>
                  <span className="text-gray-900 font-medium">{formatPrice(setupFees)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 mt-2 border-t border-gray-200 font-semibold text-gray-900 text-lg">
                <span>Estimated subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Attached design proofs</h2>
              {items.map(item => <div key={item.product.id} className="border-t py-3 text-sm">
                <p className="font-medium">{item.product.name}</p>
                <p>{item.proofAttachment ? `${item.proofAttachment.reviewVersion} — ${item.proofAttachment.reviewStatus}; embossing: ${item.proofAttachment.emboss.preference}` : 'No saved proof attached yet.'}</p>
                <Link className="inline-block py-3 text-amber-700 underline" href={item.proofAttachment?.workflow === 'upload' ? '/upload-proof?product=' + encodeURIComponent(item.product.id) + '&review=' + encodeURIComponent(item.proofAttachment.designId) : '/design/' + encodeURIComponent(item.product.id)}>Review / attach saved design</Link>
              </div>)}
              <p className="text-xs text-gray-500">The server checks the saved version again before creating an order. Payment does not approve the print or emboss proof.</p>
            </section>
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Smith"
                />
                <Input
                  label="Email"
                  type="email"
                  id="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@company.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
                <Input
                  label="Company"
                  id="company"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Your Company"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Order Notes</h2>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Special instructions, artwork notes, etc."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            {pendingOrder && <p role="status" className="text-sm text-green-700">Invoice request {pendingOrder} recorded for Interstate Graphics. Unpaid: no invoice sent, no card charged and no production approval granted.</p>}
            <Button type="submit" loading={loading} size="lg" className="w-full">
              <FileText className="w-5 h-5 mr-2" />
              Invoice me
            </Button>
            <p className="text-xs text-gray-500">Interstate Graphics will review your request and prepare an invoice. Shipping and tax will be confirmed separately. Submitting this request does not take payment or approve production.</p>
          </div>
        </form>
      </Container>
    </section>
  );
}
