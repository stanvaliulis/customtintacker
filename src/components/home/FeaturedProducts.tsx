import Container from '@/components/ui/Container';
import ProductCard from '@/components/products/ProductCard';
import { getFeaturedProducts } from '@/lib/products';
import Link from 'next/link';

export default async function FeaturedProducts() {
  const featured = await getFeaturedProducts();

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Signs</h2>
          <p className="mt-3 text-lg text-gray-500 max-w-xl">
            Pick a size, pick a shape, tell us how many. Simple as that.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products" className="text-amber-600 hover:text-amber-700 font-semibold">
            View All Products &rarr;
          </Link>
        </div>
      </Container>
    </section>
  );
}
