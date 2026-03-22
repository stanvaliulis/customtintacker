import Link from 'next/link';
import Container from '@/components/ui/Container';

const shapes = [
  { name: 'Square', from: '$3.50', slug: '8x8-embossed-tacker' },
  { name: 'Circle', from: '$5.00', slug: '12-inch-circle-tacker' },
  { name: 'Bottle Cap', from: '$6.90', slug: 'bottle-cap-tacker' },
  { name: 'Can Shape', from: '$8.60', slug: 'can-shape-tacker' },
  { name: 'Custom Die-Cut', from: '$11.00', slug: 'die-cut-custom-tacker' },
  { name: 'Specialty', from: 'Call us', slug: null },
];

export default function BrandShowcase() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
      <Container>
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Every shape you can think of
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {shapes.map((shape) => {
            const inner = (
              <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm sm:text-base">
                <span className="font-semibold text-gray-900">{shape.name}</span>
                <span className="text-gray-400">from</span>
                <span className="font-semibold text-amber-600">{shape.from}</span>
              </span>
            );

            if (shape.slug) {
              return (
                <Link key={shape.name} href={`/products/${shape.slug}`}>
                  {inner}
                </Link>
              );
            }

            return (
              <Link key={shape.name} href="/quote">
                {inner}
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
