import Link from 'next/link';
import Container from '@/components/ui/Container';
import { formatPrice } from '@/lib/utils';
import { products } from '@/data/products';

interface ShapeGroup {
  name: string;
  slug: string | null;
  shape: string;
}

const shapeGroups: ShapeGroup[] = [
  { name: 'Square', shape: 'square', slug: null },
  { name: 'Circle', shape: 'circle', slug: null },
  { name: 'Rectangle', shape: 'rectangle', slug: null },
  { name: 'Bottle Cap', shape: 'bottle-cap', slug: null },
  { name: 'Can Shape', shape: 'can', slug: null },
  { name: 'License Plate', shape: 'license-plate', slug: null },
  { name: 'State Shapes', shape: 'die-cut', slug: '/products?category=specialty' },
  { name: 'Custom Die-Cut', shape: 'custom', slug: '/quote' },
];

function getLowestPriceForShape(shape: string): number | null {
  const matching = products.filter(
    (p) => p.shape === shape && p.pricingTiers.length > 0
  );
  if (matching.length === 0) return null;
  let lowest = Infinity;
  for (const p of matching) {
    const lastTier = p.pricingTiers[p.pricingTiers.length - 1];
    if (lastTier && lastTier.pricePerUnit < lowest) {
      lowest = lastTier.pricePerUnit;
    }
  }
  return lowest === Infinity ? null : lowest;
}

function getFirstSlugForShape(shape: string): string | null {
  const match = products.find(
    (p) => p.shape === shape && p.pricingTiers.length > 0
  );
  return match ? `/products/${match.slug}` : null;
}

export default function BrandShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
      <Container>
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Every shape you can think of
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Standard shapes in stock. Custom die-cuts made to order.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {shapeGroups.map((group) => {
            const lowestPrice = group.shape !== 'custom' ? getLowestPriceForShape(group.shape) : null;
            const href = group.slug || getFirstSlugForShape(group.shape) || '/products';

            return (
              <Link key={group.name} href={href}>
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm sm:text-base">
                  <span className="font-semibold text-gray-900">{group.name}</span>
                  <span className="text-gray-400">from</span>
                  <span className="font-semibold text-amber-600">
                    {lowestPrice ? `${formatPrice(lowestPrice)}/ea` : 'Contact us'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
