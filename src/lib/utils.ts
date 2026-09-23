import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PricingTier, DistributorPricing } from '@/types/product';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function getPriceForQuantity(tiers: PricingTier[], quantity: number): number | null {
  const tier = tiers.find(
    (t) => quantity >= t.minQuantity && (t.maxQuantity === null || quantity <= t.maxQuantity)
  );
  return tier ? tier.pricePerUnit : null;
}

export function getCatalogPriceForQuantity(tiers: PricingTier[], quantity: number): number | null {
  const tier = tiers.find(
    (t) => quantity >= t.minQuantity && (t.maxQuantity === null || quantity <= t.maxQuantity)
  );
  return tier ? tier.catalogPrice : null;
}

/**
 * What a reseller pays per unit for a tier. Uses the sheet's reseller price
 * when we have one; otherwise falls back to list price minus the discount.
 */
export function getResellerUnitPrice(
  tier: PricingTier,
  multiplier: number = 1,
  distributorDiscount: number = 0.40
): number {
  if (tier.resellerPrice) return Math.round(tier.resellerPrice * multiplier);
  return Math.round(Math.round(tier.catalogPrice * multiplier) * (1 - distributorDiscount));
}

export function getLowestPrice(tiers: PricingTier[]): number {
  return Math.min(...tiers.map((t) => t.pricePerUnit));
}

export function getLowestCatalogPrice(tiers: PricingTier[]): number {
  return Math.min(...tiers.map((t) => t.catalogPrice));
}

export function getMinimumQuantity(tiers: PricingTier[]): number {
  return Math.min(...tiers.map((t) => t.minQuantity));
}

/**
 * Get distributor pricing for a product at a given quantity.
 *
 * ASI/SAGE/PPAI pricing model:
 * - retailPrice: what end customers pay (our standard pricing)
 * - catalogPrice: what goes in ASI/SAGE catalogs (the "list" price distributors show their clients)
 * - distributorCost: what the distributor actually pays us (catalogPrice * (1 - discount))
 * - distributorSavings: percentage saved vs retail
 */
export function getDistributorPrice(
  tiers: PricingTier[],
  quantity: number,
  distributorDiscount: number = 0.40
): DistributorPricing | null {
  const tier = tiers.find(
    (t) => quantity >= t.minQuantity && (t.maxQuantity === null || quantity <= t.maxQuantity)
  );
  if (!tier) return null;

  const retailPrice = tier.pricePerUnit;
  const catalogPrice = tier.catalogPrice;
  const distributorCost = getResellerUnitPrice(tier, 1, distributorDiscount);
  const distributorSavings = retailPrice > 0
    ? Math.round(((retailPrice - distributorCost) / retailPrice) * 100)
    : 0;

  return {
    retailPrice,
    catalogPrice,
    distributorCost,
    distributorSavings,
  };
}
