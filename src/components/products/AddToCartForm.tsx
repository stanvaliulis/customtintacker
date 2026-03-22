'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Product, BackingOption } from '@/types/product';
import { backingOptions } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { formatPrice, getPriceForQuantity } from '@/lib/utils';
import Button from '@/components/ui/Button';
import PricingTable from './PricingTable';
import { ShoppingCart, Zap } from 'lucide-react';

interface AddToCartFormProps {
  product: Product;
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const { addItem, isWholesale } = useCart();
  const [quantity, setQuantity] = useState(product.minimumOrder);
  const [backing, setBacking] = useState<BackingOption>(product.backingOptions[0]);

  const backingConfig = backingOptions.find((b) => b.id === backing);
  const backingMultiplier = backingConfig?.priceMultiplier ?? 1;
  const basePrice = getPriceForQuantity(product.pricingTiers, quantity);
  const adjustedPrice = basePrice ? Math.round(basePrice * backingMultiplier) : null;
  const finalPrice = adjustedPrice && isWholesale ? Math.round(adjustedPrice * (1 - product.wholesaleDiscount)) : adjustedPrice;
  const lineTotal = finalPrice ? finalPrice * quantity : 0;

  const quantityValid = quantity >= product.minimumOrder && basePrice !== null;

  function handleAdd() {
    if (!quantityValid) return;
    addItem(product, quantity, backing);
    toast.success(`Added ${quantity}x ${product.name} to cart`);
  }

  return (
    <div className="space-y-6">
      {/* Pricing Table */}
      <PricingTable
        tiers={product.pricingTiers}
        selectedQuantity={quantity}
        wholesaleDiscount={product.wholesaleDiscount}
        isWholesale={isWholesale}
        backingMultiplier={backingMultiplier}
      />

      {/* Material */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">Material</label>
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="font-medium text-sm text-amber-400">{backingConfig?.label ?? '.024" Gauge Aluminum'}</span>
          <p className="text-xs text-gray-500 mt-1">{backingConfig?.description ?? 'Industry-standard recycled aluminum.'}</p>
        </div>
      </div>

      {/* Quantity Input */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">
          Quantity <span className="text-gray-500 font-normal">(min. {product.minimumOrder})</span>
        </label>
        <input
          type="number"
          min={product.minimumOrder}
          value={quantity}
          max={1000}
          onChange={(e) => setQuantity(Math.min(1000, Math.max(product.minimumOrder, parseInt(e.target.value) || product.minimumOrder)))}
          className="w-full rounded-xl border border-gray-700/50 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono text-lg"
        />
        {!quantityValid && quantity < product.minimumOrder && (
          <p className="text-sm text-red-400 mt-2">Minimum order is {product.minimumOrder} units.</p>
        )}
      </div>

      {/* Order Summary */}
      {finalPrice && (
        <div className="bg-gray-900/80 rounded-xl border border-gray-700/50 p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h4>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{quantity.toLocaleString()} units x {formatPrice(finalPrice)}/unit</span>
            <span className="text-gray-300 font-medium">{formatPrice(lineTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mb-3">
            <span>Setup fee (one-time)</span>
            <span className="text-gray-300 font-medium">{formatPrice(product.setupFee)}</span>
          </div>
          <div className="border-t border-gray-700/50 pt-3 flex justify-between items-baseline">
            <span className="font-semibold text-white">Estimated Total</span>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              {formatPrice(lineTotal + product.setupFee)}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAdd}
        disabled={!quantityValid}
        size="lg"
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold shadow-lg shadow-amber-500/20 py-4 text-lg"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Add to Cart
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Zap className="w-4 h-4 text-amber-500/50" />
        <span>Estimated production: {product.leadTimeDays} business days</span>
      </div>
    </div>
  );
}
