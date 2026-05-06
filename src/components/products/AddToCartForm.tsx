'use client';

import Link from 'next/link';
import { Product } from '@/types/product';
import { backingOptions } from '@/data/products';
import { MessageSquareQuote, Zap } from 'lucide-react';

interface AddToCartFormProps {
  product: Product;
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const backingConfig = backingOptions.find((b) => b.id === product.backingOptions[0]);

  return (
    <div className="space-y-6">
      {/* Material */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Material</label>
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="font-medium text-sm text-amber-400">{backingConfig?.label ?? '.024" Gauge Aluminum'}</span>
          <p className="text-xs text-gray-500 mt-1">{backingConfig?.description ?? 'Industry-standard recycled aluminum.'}</p>
        </div>
      </div>

      {/* Request Pricing Button */}
      <Link
        href={`/quote?product=${encodeURIComponent(product.name)}&size=${encodeURIComponent(product.dimensions.displaySize)}&shape=${encodeURIComponent(product.shape)}`}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold shadow-lg shadow-amber-500/20 py-4 text-lg rounded-xl transition-all"
      >
        <MessageSquareQuote className="w-5 h-5" />
        Request Pricing
      </Link>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Zap className="w-4 h-4 text-amber-500/50" />
        <span>Estimated production: ~{product.leadTimeDays} business days</span>
      </div>
    </div>
  );
}
