'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import CartItemRow from '@/components/cart/CartItem';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const { items, subtotal, setupFees, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="py-16">
        <Container>
          <div className="text-center max-w-md mx-auto">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-6">
              Browse our products and add some tin tackers to get started.
            </p>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700">
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.product.id} item={item} />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Setup Fees</span>
                  <span>{formatPrice(setupFees)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900 text-base">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/checkout" className="block mt-6">
                <Button size="lg" className="w-full">Proceed to Checkout</Button>
              </Link>

              <Link
                href="/quote"
                className="block text-center mt-3 text-sm text-amber-600 hover:text-amber-700"
              >
                Need a custom quote instead?
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
