'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, setupFees, total, isWholesale } = useCart();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            backingId: i.selectedBacking,
          })),
          customerEmail: email,
          isWholesale,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
      }
    } catch {
      setError('Failed to connect to payment processor.');
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

        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                <span className="text-gray-600">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="text-gray-900 font-medium">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-600">Setup Fees</span>
              <span className="text-gray-900 font-medium">{formatPrice(setupFees)}</span>
            </div>
            <div className="flex justify-between pt-3 font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <Input
              label="Email Address"
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <Button
              onClick={handleCheckout}
              loading={loading}
              size="lg"
              className="w-full mt-6"
            >
              Pay with Stripe
            </Button>

            <p className="text-xs text-gray-400 text-center mt-4">
              You will be redirected to Stripe&apos;s secure checkout page to complete your payment.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
