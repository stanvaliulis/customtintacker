'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { backingOptions } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useDistributor } from '@/context/DistributorContext';
import PricingTable from './PricingTable';
import { ShoppingCart, MessageSquareQuote, Zap, Check } from 'lucide-react';

interface AddToCartFormProps {
  product: Product;
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const backingConfig = backingOptions.find((b) => b.id === product.backingOptions[0]);
  const { addItem } = useCart();
  const { isDistributor, distributorDiscount } = useDistributor();
  const [quantity, setQuantity] = useState(product.minimumOrder || 50);
  const [added, setAdded] = useState(false);

  const hasPricing = product.pricingTiers.length > 0;

  const handleAddToCart = () => {
    addItem(
      product,
      quantity,
      product.backingOptions[0] as 'standard-024',
      isDistributor ? 'distributor' : 'retail',
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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

      {/* Pricing Table */}
      {hasPricing && (
        <PricingTable
          tiers={product.pricingTiers}
          selectedQuantity={quantity}
          backingMultiplier={backingConfig?.priceMultiplier ?? 1}
        />
      )}

      {/* Quantity Selector */}
      {hasPricing && (
        <div>
          <label htmlFor="quantity" className="block text-sm font-semibold text-white mb-3">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(product.minimumOrder || 50, quantity - (quantity >= 500 ? 100 : quantity >= 100 ? 50 : 25)))}
              className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-lg font-medium"
            >
              -
            </button>
            <input
              id="quantity"
              type="number"
              value={quantity}
              min={product.minimumOrder || 50}
              onChange={(e) => setQuantity(Math.max(product.minimumOrder || 50, parseInt(e.target.value) || product.minimumOrder || 50))}
              className="w-24 h-10 rounded-lg border border-gray-700 bg-gray-800 text-center text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + (quantity >= 500 ? 100 : quantity >= 100 ? 50 : 25))}
              className="w-10 h-10 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-lg font-medium"
            >
              +
            </button>
            <span className="text-xs text-gray-500">Min: {product.minimumOrder || 50}</span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      {hasPricing ? (
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={added}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-emerald-500 disabled:to-emerald-600 text-gray-950 font-bold shadow-lg shadow-amber-500/20 py-4 text-lg rounded-xl transition-all"
        >
          {added ? (
            <>
              <Check className="w-5 h-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </>
          )}
        </button>
      ) : (
        <Link
          href={`/quote?product=${encodeURIComponent(product.name)}&size=${encodeURIComponent(product.dimensions.displaySize)}&shape=${encodeURIComponent(product.shape)}`}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold shadow-lg shadow-amber-500/20 py-4 text-lg rounded-xl transition-all"
        >
          <MessageSquareQuote className="w-5 h-5" />
          Request Pricing
        </Link>
      )}

      {/* Secondary: Request Quote */}
      {hasPricing && (
        <Link
          href={`/quote?product=${encodeURIComponent(product.name)}&size=${encodeURIComponent(product.dimensions.displaySize)}&shape=${encodeURIComponent(product.shape)}`}
          className="w-full flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white font-medium py-3 text-sm rounded-xl transition-all"
        >
          <MessageSquareQuote className="w-4 h-4" />
          Or request a custom quote
        </Link>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Zap className="w-4 h-4 text-amber-500/50" />
        <span>Estimated production: ~{product.leadTimeDays} business days</span>
      </div>
    </div>
  );
}
