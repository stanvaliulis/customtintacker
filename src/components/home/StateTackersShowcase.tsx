import Link from 'next/link';
import Container from '@/components/ui/Container';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import { MapPin, ArrowRight } from 'lucide-react';

const FEATURED_STATES = ['Texas', 'California', 'Florida', 'New York', 'Illinois', 'Ohio', 'Michigan', 'Tennessee'];

export default function StateTackersShowcase() {
  const stateTackers = products.filter(
    (p) => p.name.includes('State Tacker') || p.name === 'United States Tacker'
  );

  const featured = FEATURED_STATES.map((state) =>
    stateTackers.find((p) => p.name.startsWith(state))
  ).filter(Boolean);

  const lowestPrice = stateTackers.reduce((min, p) => {
    const lastTier = p.pricingTiers[p.pricingTiers.length - 1];
    return lastTier && lastTier.pricePerUnit < min ? lastTier.pricePerUnit : min;
  }, Infinity);

  return (
    <section className="py-16 sm:py-20 bg-gray-950 text-white">
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <MapPin className="w-3.5 h-3.5" />
              New
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              State-shaped tackers
            </h2>
            <p className="mt-3 text-gray-400 text-lg max-w-xl">
              All 50 states plus a USA outline. Die-cut embossed aluminum in the shape of your state. Show your local pride.
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-amber-400">
              From {lowestPrice < Infinity ? formatPrice(lowestPrice) : '$13'}/ea
            </span>
            <span className="text-gray-500">at volume</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {featured.map((product) => {
            if (!product) return null;
            const lastTier = product.pricingTiers[product.pricingTiers.length - 1];
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group p-5 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-amber-500/50 hover:bg-gray-900 transition-all"
              >
                <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors mb-1">
                  {product.name.replace(' State Tacker', '')}
                </h3>
                <p className="text-sm text-gray-500 mb-3">Die-cut state shape</p>
                {lastTier && (
                  <span className="text-sm font-medium text-amber-400">
                    From {formatPrice(lastTier.pricePerUnit)}/ea
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            View all 50 states + USA
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
