'use client';

import { PricingTier } from '@/types/product';
import { formatPrice, getResellerUnitPrice } from '@/lib/utils';
import { useDistributor } from '@/context/DistributorContext';

/**
 * "From $X/ea" — the lowest per-unit price at volume.
 * Retail for the public; reseller price when a distributor is logged in.
 */
export default function FromPrice({ tiers, className }: { tiers: PricingTier[]; className?: string }) {
  const { isDistributor, distributorDiscount } = useDistributor();
  if (tiers.length === 0) return null;
  const last = tiers[tiers.length - 1];
  const price = isDistributor ? getResellerUnitPrice(last, 1, distributorDiscount) : last.pricePerUnit;
  return (
    <span className={className}>
      From {formatPrice(price)}/ea{isDistributor ? ' (your cost)' : ''}
    </span>
  );
}
