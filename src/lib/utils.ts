import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PricingTier } from '@/types/product';

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

export function getLowestPrice(tiers: PricingTier[]): number {
  return Math.min(...tiers.map((t) => t.pricePerUnit));
}

export function getMinimumQuantity(tiers: PricingTier[]): number {
  return Math.min(...tiers.map((t) => t.minQuantity));
}
