'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="text-center max-w-md mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-gray-600 mb-2">
            Thank you for your order. You will receive an email confirmation shortly.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Our team will begin processing your order and reach out regarding artwork details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Contact Us</Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
