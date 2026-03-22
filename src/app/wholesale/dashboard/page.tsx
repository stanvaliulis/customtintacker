'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { products, backingOptions } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { LogOut, Tag } from 'lucide-react';

export default function WholesaleDashboardPage() {
  const { data: session } = useSession();
  const { setWholesale, isWholesale } = useCart();

  useEffect(() => {
    if (session?.user) {
      setWholesale(true);
    }
  }, [session, setWholesale]);

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wholesale Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, <span className="font-medium text-gray-700">{session?.user?.name || 'Wholesale'}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <Tag className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Wholesale pricing is active.</span> All products in your cart are automatically discounted with your wholesale rate.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Wholesale Pricing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Retail (at 1000+)</th>
                <th className="text-right px-4 py-3 font-medium text-amber-600">Your Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Discount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const lowestTier = product.pricingTiers.find((t) => t.maxQuantity === null);
                const retailPrice = lowestTier?.pricePerUnit || 0;
                const wholesalePrice = Math.round(retailPrice * (1 - product.wholesaleDiscount));
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.dimensions.displaySize}</td>
                    <td className="px-4 py-3 text-right text-gray-500 line-through">{formatPrice(retailPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{formatPrice(wholesalePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="success">{Math.round(product.wholesaleDiscount * 100)}% off</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/products/${product.slug}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                        Order
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
