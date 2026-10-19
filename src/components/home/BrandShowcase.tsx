import Link from 'next/link';
import Container from '@/components/ui/Container';
import { formatPrice } from '@/lib/utils';
import { shapePriceProduct, publicTiers, lowestTier } from '@/lib/catalog-pricing';
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

export default function BrandShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
      <Container>
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Every shape you can think of
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Aluminum signs in standard shapes. Custom die-cuts quoted for your artwork.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {shapeGroups.map((group) => {
            const product = shapePriceProduct(products, group.shape);
            const tier = product ? lowestTier(publicTiers(product.pricingTiers)) : undefined;
            const href = product ? `/products/${product.slug}` : group.slug || '/products';

            return (
              <Link key={group.name} href={href}>
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm sm:text-base">
                  <span className="font-semibold text-gray-900">{group.name}</span>
                  {tier && <span className="text-gray-500">from</span>}
                  <span className="font-semibold text-amber-600">
                    {tier ? `${formatPrice(tier.pricePerUnit)}/ea at ${tier.minQuantity.toLocaleString()} units` : 'Contact us'}
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
