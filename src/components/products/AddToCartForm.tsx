'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Product, BackingOption } from '@/types/product';
import { backingOptions } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useDistributor } from '@/context/DistributorContext';
import { formatPrice, getPriceForQuantity, getCatalogPriceForQuantity } from '@/lib/utils';
import Button from '@/components/ui/Button';
import PricingTable from './PricingTable';
import { RUSH_FEE_RATE } from '@/context/CartContext';
import { ShoppingCart, Zap, Tag, Clock } from 'lucide-react';

interface AddToCartFormProps {
  product: Product;
}

export default function AddToCartForm({ product }: AddToCartFormProps) {
  const { addItem } = useCart();
  const { isDistributor, distributorDiscount } = useDistributor();
  const [quantity, setQuantity] = useState(product.minimumOrder);
  const [backing, setBacking] = useState<BackingOption>(product.backingOptions[0]);
  const [isRush, setIsRush] = useState(false);

  const backingConfig = backingOptions.find((b) => b.id === backing);
  const backingMultiplier = backingConfig?.priceMultiplier ?? 1;

  // Retail price calculation
  const baseRetailPrice = getPriceForQuantity(product.pricingTiers, quantity);
  const adjustedRetailPrice = baseRetailPrice ? Math.round(baseRetailPrice * backingMultiplier) : null;

  // Distributor price calculation
  const baseCatalogPrice = getCatalogPriceForQuantity(product.pricingTiers, quantity);
  const adjustedCatalogPrice = baseCatalogPrice ? Math.round(baseCatalogPrice * backingMultiplier) : null;
  const distributorCost = adjustedCatalogPrice ? Math.round(adjustedCatalogPrice * (1 - distributorDiscount)) : null;

  // Final price depends on user type
  const finalPrice = isDistributor ? distributorCost : adjustedRetailPrice;
  const lineTotal = finalPrice ? finalPrice * quantity : 0;
  const rushFee = isRush ? Math.round(lineTotal * RUSH_FEE_RATE) : 0;
  const maxQuantity = isDistributor ? 99999 : 1000;

  const quantityValid = quantity >= product.minimumOrder && baseRetailPrice !== null;

  // Savings calculations for distributor
  const retailLineTotal = adjustedRetailPrice ? adjustedRetailPrice * quantity : 0;
  const distributorSavings = retailLineTotal > 0 && isDistributor ? retailLineTotal - lineTotal : 0;

  function handleAdd() {
    if (!quantityValid) return;
    addItem(product, quantity, backing, isDistributor ? 'distributor' : 'retail', isRush);
    toast.success(`Added ${quantity}x ${product.name} to cart${isRush ? ' (Rush)' : ''}`);
  }

  return (
    <div className="space-y-6">
      {/* Pricing Table */}
      <PricingTable
        tiers={product.pricingTiers}
        selectedQuantity={quantity}
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
          max={maxQuantity}
          onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(product.minimumOrder, parseInt(e.target.value) || product.minimumOrder)))}
          className="w-full rounded-xl border border-gray-700/50 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono text-lg"
        />
        {!quantityValid && quantity < product.minimumOrder && (
          <p className="text-sm text-red-400 mt-2">Minimum order is {product.minimumOrder} units.</p>
        )}
      </div>

      {/* Rush Processing */}
      <div>
        <button
          type="button"
          onClick={() => setIsRush(!isRush)}
          className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
            isRush
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-gray-700/50 bg-gray-900/30 hover:border-gray-600'
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
            isRush ? 'bg-amber-500 text-gray-950' : 'border border-gray-600 bg-gray-800'
          }`}>
            {isRush && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white text-sm">Rush Processing</span>
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">+25%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Get your order in ~15 business days instead of ~30
            </p>
          </div>
        </button>
      </div>

      {/* Order Summary */}
      {finalPrice && (
        <div className="bg-gray-900/80 rounded-xl border border-gray-700/50 p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h4>

          {isDistributor && adjustedRetailPrice && (
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span className="line-through">{quantity.toLocaleString()} units x {formatPrice(adjustedRetailPrice)}/unit (retail)</span>
              <span className="line-through">{formatPrice(retailLineTotal)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              {quantity.toLocaleString()} units x {formatPrice(finalPrice)}/unit
              {isDistributor && <span className="text-amber-400 ml-1">(your cost)</span>}
            </span>
            <span className="text-gray-300 font-medium">{formatPrice(lineTotal)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Setup fee (one-time)</span>
            <span className="text-gray-300 font-medium">{formatPrice(product.setupFee)}</span>
          </div>

          {isRush && (
            <div className="flex justify-between text-sm mb-2 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Rush processing fee
              </span>
              <span className="text-amber-400 font-semibold">+{formatPrice(rushFee)}</span>
            </div>
          )}

          {isDistributor && distributorSavings > 0 && (
            <div className="flex justify-between text-sm mb-3 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Distributor savings
              </span>
              <span className="text-amber-400 font-semibold">-{formatPrice(distributorSavings)}</span>
            </div>
          )}

          <div className="border-t border-gray-700/50 pt-3 flex justify-between items-baseline">
            <span className="font-semibold text-white">Estimated Total</span>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              {formatPrice(lineTotal + rushFee + product.setupFee)}
            </span>
          </div>

          {isDistributor && (
            <p className="text-xs text-amber-400/60 mt-2">
              Pricing reflects your distributor discount.
            </p>
          )}
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
        <span>Estimated production: {isRush ? '~15' : `~${product.leadTimeDays}`} business days</span>
      </div>
    </div>
  );
}
