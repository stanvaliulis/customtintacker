'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle, Phone, MessageSquare } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="text-center max-w-lg mx-auto">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Received!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your order. A member of our team will reach out shortly
            with payment details and to confirm everything.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-2">What happens next?</h2>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>We review your order and confirm availability</li>
              <li>We send you a payment link or invoice</li>
              <li>Once paid, we start production (~15 business days)</li>
              <li>Your signs ship and you get a tracking number</li>
            </ol>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-gray-700">
              <MessageSquare className="w-4 h-4" />
              Contact Us
            </Link>
            <a href="tel:8155414569" className="flex items-center gap-1.5 hover:text-gray-700">
              <Phone className="w-4 h-4" />
              (815) 541-4569
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
