'use client';

import { PricingTier } from '@/types/product';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TrendingDown, Star, Info, Tag } from 'lucide-react';
import { useDistributor } from '@/context/DistributorContext';

interface PricingTableProps {
  tiers: PricingTier[];
  selectedQuantity: number;
  backingMultiplier?: number;
}

const MAX_PUBLIC_QUANTITY = 1000;

export default function PricingTable({ tiers, selectedQuantity, backingMultiplier = 1 }: PricingTableProps) {
  const { isDistributor, distributorDiscount } = useDistributor();

  // Non-distributors only see tiers up to 1,000
  const visibleTiers = isDistributor
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
          {isDistributor ? 'Distributor Pricing' : 'Volume Pricing'}
        </h3>
        {isDistributor ? (
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {Math.round(distributorDiscount * 100)}% distributor discount
          </span>
        ) : (
          firstTierPrice > 0 && (
            <span className="text-xs text-emerald-400 font-medium">
              Save up to {Math.round(((firstTierPrice - tiers[bestValueIndex].pricePerUnit) / firstTierPrice) * 100)}% at volume
            </span>
          )
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="px-4 py-3 text-left font-medium text-gray-400 text-xs uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">
                {isDistributor ? 'Retail' : 'Price/Unit'}
              </th>
              {isDistributor && (
                <>
                  <th className="px-4 py-3 text-right font-medium text-amber-400 text-xs uppercase tracking-wider">Your Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">Catalog/List</th>
                  <th className="px-4 py-3 text-right font-medium text-emerald-400 text-xs uppercase tracking-wider">Your Margin</th>
                </>
              )}
              {!isDistributor && (
                <th className="px-4 py-3 text-right font-medium text-gray-400 text-xs uppercase tracking-wider">Savings</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleTiers.map((tier, index) => {
              const isActive =
                selectedQuantity >= tier.minQuantity &&
                (tier.maxQuantity === null || selectedQuantity <= tier.maxQuantity);
              const isBestValue = index === bestValueIndex;
              const adjustedRetail = Math.round(tier.pricePerUnit * backingMultiplier);
              const adjustedCatalog = Math.round(tier.catalogPrice * backingMultiplier);
              const distributorCost = Math.round(adjustedCatalog * (1 - distributorDiscount));
              const margin = adjustedCatalog - distributorCost;
              const marginPercent = adjustedCatalog > 0 ? Math.round((margin / adjustedCatalog) * 100) : 0;
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

                  {/* Retail price column */}
                  <td className={cn(
                    'px-4 py-3 text-right font-mono',
                    isDistributor ? 'text-gray-500 line-through' : 'text-gray-300',
                    isActive && !isDistributor && 'font-semibold text-white',
                  )}>
                    {formatPrice(adjustedRetail)}
                  </td>

                  {isDistributor && (
                    <>
                      {/* Distributor cost */}
                      <td className={cn(
                        'px-4 py-3 text-right font-semibold font-mono',
                        isActive ? 'text-amber-400' : 'text-amber-500/80'
                      )}>
                        {formatPrice(distributorCost)}
                      </td>

                      {/* Catalog/List price */}
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">
                        {formatPrice(adjustedCatalog)}
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'font-medium',
                          isActive ? 'text-emerald-300' : 'text-emerald-400'
                        )}>
                          {formatPrice(margin)} ({marginPercent}%)
                        </span>
                      </td>
                    </>
                  )}

                  {!isDistributor && (
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
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Distributor savings highlight */}
      {isDistributor && (
        <div className="px-4 py-3 border-t border-gray-700/50 bg-amber-500/5 flex items-start gap-2">
          <Tag className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/80">
            Pricing reflects your {Math.round(distributorDiscount * 100)}% distributor discount. Catalog/List price is what you show in ASI/SAGE catalogs. Your margin is the difference between catalog price and your cost.
          </p>
        </div>
      )}

      {/* Lead time note */}
      <div className="px-4 py-3 border-t border-gray-700/50 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500">
          Average lead time: ~15 business days. Orders over 500 units may require additional time.
        </p>
      </div>

      {/* Call to action for larger quantities (non-distributors only) */}
      {!isDistributor && tiers.length > visibleTiers.length && (
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
