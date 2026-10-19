import type { PricingTier, Product } from '@/types/product';

/** Existing public-table limit. Keep headline, table and structured offers aligned. */
export const MAX_PUBLIC_QUANTITY = 1000;
export const publicTiers = (tiers: PricingTier[]) => tiers.filter(t => t.minQuantity <= MAX_PUBLIC_QUANTITY);
export const lowestTier = (tiers: PricingTier[]) => tiers.reduce<PricingTier | undefined>((best, tier) => !best || tier.pricePerUnit < best.pricePerUnit ? tier : best, undefined);
export function shapePriceProduct(products: Product[], shape: string) {
  return products.filter(p => p.shape === shape && p.metadata.material.toLowerCase().includes('aluminum') && publicTiers(p.pricingTiers).length)
    .sort((a, b) => lowestTier(publicTiers(a.pricingTiers))!.pricePerUnit - lowestTier(publicTiers(b.pricingTiers))!.pricePerUnit)[0];
}
