// Owner-confirmed 2026-10-26. Timing is from proof approval to shipment, not delivery.
import type { Product } from '@/types/product';
export const manufacturingFacts = {
  standard: '2–3 weeks from proof approval to shipment', rush: '1–2 weeks from proof approval to shipment', rushSurchargeRate: 0.30,
  material: '.024-inch aluminum, white on both sides', printMethod: 'Direct print',
  timing: 'Standard: 2–3 weeks. Rush: 1–2 weeks with a 30% surcharge. Both ranges run from proof approval to shipment, not delivery.',
} as const;
export function isAluminumProduct(product: Pick<Product, 'metadata'>): boolean { return /aluminum/i.test(product.metadata.material); }
export function productTiming(product: Pick<Product, 'metadata' | 'leadTimeDays'>): string {
  return isAluminumProduct(product) ? manufacturingFacts.standard : product.leadTimeDays + ' business days';
}
