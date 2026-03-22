import { PricingTier } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TrendingDown, Star, Info } from 'lucide-react';

interface PricingTableProps {
  tiers: PricingTier[];
  selectedQuantity: number;
  wholesaleDiscount?: number;
  isWholesale?: boolean;
  backingMultiplier?: number;
}

const MAX_PUBLIC_QUANTITY = 1000;

export default function PricingTable({ tiers, selectedQuantity, wholesaleDiscount = 0, isWholesale = false, backingMultiplier = 1 }: PricingTableProps) {
  // Non-distributors only see tiers up to 1,000
  const visibleTiers = isWholesale
    ? tiers
    : tiers.filter((t) => t.minQuantity <= MAX_PUBLIC_QUANTITY);

  const bestValueIndex = visibleTiers.length - 1;
  const firstTierPrice = visibleTiers[0]?.pricePerUnit ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/50">
      {/* Header */}
      <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-amber-400" />
          Volume Pricing
        </h3>
        {firstTierPrice > 0 && (
          <span className="text-xs text-emerald-400 font-medium">
            Save up to {Math.round(((firstTierPrice - tiers[bestValueIndex].pricePerUnit) / firstTierPrice) * 100)}% at volume
          </span>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/50">
            <th className="px-4 py-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">Quantity</th>
            <th className="px-4 py-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">Price/Unit</th>
            <th className="px-4 py-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">Savings</th>
            {isWholesale && (
              <th className="px-4 py-3 text-right font-medium text-amber-400 text-xs uppercase tracking-wider">Wholesale</th>
            )}
          </tr>
        </thead>
        <tbody>
          {visibleTiers.map((tier, index) => {
            const isActive =
              selectedQuantity >= tier.minQuantity &&
              (tier.maxQuantity === null || selectedQuantity <= tier.maxQuantity);
            const isBestValue = index === bestValueIndex;
            const adjustedPrice = Math.round(tier.pricePerUnit * backingMultiplier);
            const wholesalePrice = Math.round(adjustedPrice * (1 - wholesaleDiscount));
            const savingsPercent = firstTierPrice > 0
              ? Math.round(((firstTierPrice - tier.pricePerUnit) / firstTierPrice) * 100)
              : 0;

            return (
              <tr
                key={tier.minQuantity}
                className={cn(
                  'border-b border-gray-800/50 last:border-0 transition-colors',
                  isActive && 'bg-amber-500/10',
                  isBestValue && !isActive && 'bg-emerald-500/5'
                )}
              >
                <td className={cn(
                  'px-4 py-3 text-gray-300',
                  isActive && 'font-semibold text-amber-400'
                )}>
                  <div className="flex items-center gap-2">
                    {tier.minQuantity.toLocaleString()}
                    {tier.maxQuantity ? ` - ${tier.maxQuantity.toLocaleString()}` : '+'}
                    {isBestValue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase tracking-wide">
                        <Star className="w-2.5 h-2.5" />
                        Best
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                </td>
                <td className={cn(
                  'px-4 py-3 text-right text-gray-300 font-mono',
                  isActive && 'font-semibold text-white',
                  isWholesale && 'line-through text-gray-500'
                )}>
                  {formatPrice(adjustedPrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  {savingsPercent > 0 ? (
                    <span className={cn(
                      'text-emerald-400 font-medium',
                      isActive && 'text-emerald-300'
                    )}>
                      -{savingsPercent}%
                    </span>
                  ) : (
                    <span className="text-gray-600">--</span>
                  )}
                </td>
                {isWholesale && (
                  <td className={cn(
                    'px-4 py-3 text-right font-semibold font-mono',
                    isActive ? 'text-amber-400' : 'text-amber-500/80'
                  )}>
                    {formatPrice(wholesalePrice)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Lead time note */}
      <div className="px-4 py-3 border-t border-gray-700/50 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500">
          Average lead time: ~15 business days. Orders over 500 units may require additional time.
        </p>
      </div>

      {/* Call to action for larger quantities (non-distributors only) */}
      {!isWholesale && tiers.length > visibleTiers.length && (
        <div className="px-4 py-3 border-t border-gray-700/50 bg-amber-500/5">
          <p className="text-xs text-amber-400/80">
            Need more than 1,000?{' '}
            <a href="/distributors" className="underline hover:text-amber-300">Become a distributor</a>{' '}
            or <a href="/quote" className="underline hover:text-amber-300">request a custom quote</a> for volume pricing.
          </p>
        </div>
      )}
    </div>
  );
}
