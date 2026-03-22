import { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { products } from '@/data/products';
import { ProductShape } from '@/types/product';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Design Your Tin Tacker | Custom Tin Tackers',
  description:
    'Design your custom tin tacker sign online. Choose a shape, pick a size, and launch our free design editor to create your artwork. Upload logos, add text, and preview your sign in real time.',
  keywords: [
    'design tin tacker',
    'custom sign designer',
    'tin tacker design tool',
    'online sign maker',
    'create tin tacker',
  ],
  openGraph: {
    title: 'Design Your Tin Tacker | Custom Tin Tackers',
    description:
      'Free online design tool for custom embossed aluminum tin tacker signs. Choose a shape, pick a size, and create your artwork.',
    url: 'https://customtintackers.com/design',
  },
  alternates: {
    canonical: 'https://customtintackers.com/design',
  },
};

/* ------------------------------------------------------------------ */
/*  Shape definitions with SVG icons (same icons as QuoteBuilder)      */
/* ------------------------------------------------------------------ */

interface ShapeDefinition {
  id: ProductShape;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SHAPES: ShapeDefinition[] = [
  {
    id: 'square',
    label: 'Square',
    description: 'Classic square shape for bold, balanced designs.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="8" y="8" width="48" height="48" rx="3" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Versatile rectangular format for wide or tall layouts.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="14" width="56" height="36" rx="3" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    description: 'Eye-catching round signs for logos and brands.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="32" cy="32" r="26" />
      </svg>
    ),
  },
  {
    id: 'can',
    label: 'Can Shape',
    description: 'Unique can-shaped profile for beverage brands.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8 C18 8 22 4 32 4 C42 4 46 8 46 8 L46 56 C46 56 42 60 32 60 C22 60 18 56 18 56 Z" />
        <ellipse cx="32" cy="8" rx="14" ry="4" />
      </svg>
    ),
  },
  {
    id: 'bottle-cap',
    label: 'Bottle Cap',
    description: 'Iconic bottle-cap shape that turns heads.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 4 L36 10 L44 8 L42 16 L50 18 L46 24 L52 30 L46 34 L50 40 L42 42 L44 50 L36 48 L32 54 L28 48 L20 50 L22 42 L14 40 L18 34 L12 30 L18 24 L14 18 L22 16 L20 8 L28 10 Z" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    description: 'Directional arrow signs for wayfinding.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M4 32 L16 18 L16 24 L48 24 L48 18 L60 32 L48 46 L48 40 L16 40 L16 46 Z" />
      </svg>
    ),
  },
  {
    id: 'street-sign',
    label: 'Street Sign',
    description: 'Classic street-sign format for themed displays.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="20" width="56" height="24" rx="4" />
      </svg>
    ),
  },
  {
    id: 'license-plate',
    label: 'License Plate',
    description: 'Familiar license-plate shape for fun branding.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="18" width="56" height="28" rx="4" />
        <circle cx="12" cy="24" r="2" fill="currentColor" />
        <circle cx="52" cy="24" r="2" fill="currentColor" />
        <circle cx="12" cy="40" r="2" fill="currentColor" />
        <circle cx="52" cy="40" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'shield',
    label: 'Shield',
    description: 'Distinctive shield shape for premium branding.',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 6 L52 14 L52 34 C52 44 44 52 32 58 C20 52 12 44 12 34 L12 14 Z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: group products by shape                                    */
/* ------------------------------------------------------------------ */

function getProductsForShape(shape: ProductShape) {
  return products
    .filter((p) => p.shape === shape)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ================================================================== */
/*  PAGE COMPONENT                                                     */
/* ================================================================== */

export default function DesignLandingPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Design Your Sign Online
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Pick a shape, choose a size, and launch our free design editor.
              Upload your logo, add text, pick colors — then order in minutes.
            </p>
            <p className="text-sm text-gray-400">
              No design skills required. Start with a blank canvas or use one of
              our templates.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Shape Selector Grid ───────────────────────────────────── */}
      <section className="bg-gray-950 py-14 sm:py-18">
        <Container>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            Choose Your Shape
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            Select a shape below to see available sizes, then launch the editor
            for that product.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {SHAPES.map((shape) => {
              const shapeProd = getProductsForShape(shape.id);
              const hasProducts = shapeProd.length > 0;

              return (
                <a
                  key={shape.id}
                  href={hasProducts ? `#shape-${shape.id}` : undefined}
                  className={`group flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${
                    hasProducts
                      ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-amber-500 hover:bg-gray-800 hover:text-amber-400 cursor-pointer'
                      : 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-default opacity-50'
                  }`}
                >
                  <div className="transition-colors">
                    {shape.icon}
                  </div>
                  <span className="text-sm font-semibold text-center">
                    {shape.label}
                  </span>
                  {hasProducts ? (
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">
                      {shapeProd.length} size{shapeProd.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">Custom quote</span>
                  )}
                </a>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Size Cards per Shape ──────────────────────────────────── */}
      <section className="bg-gray-900 py-14 sm:py-18">
        <Container>
          {SHAPES.map((shape) => {
            const shapeProd = getProductsForShape(shape.id);
            if (shapeProd.length === 0) return null;

            return (
              <div key={shape.id} id={`shape-${shape.id}`} className="mb-14 last:mb-0 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-amber-500">{shape.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {shape.label} Signs
                    </h3>
                    <p className="text-sm text-gray-400">{shape.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {shapeProd.map((product) => {
                    const lowestPrice = Math.min(
                      ...product.pricingTiers.map((t) => t.pricePerUnit),
                    );

                    return (
                      <Link
                        key={product.id}
                        href={`/design/${product.id}`}
                        className="group bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-amber-500 hover:bg-gray-800/80 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                              {product.dimensions.displaySize}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {product.shortDescription}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          <div>
                            <span className="text-xs text-gray-500">from</span>
                            <span className="ml-1 text-lg font-bold text-amber-400">
                              {formatPrice(lowestPrice)}
                            </span>
                            <span className="text-xs text-gray-500">/unit</span>
                          </div>
                          <span className="text-xs font-medium text-amber-600 bg-amber-600/10 px-2 py-1 rounded group-hover:bg-amber-600/20 transition-colors">
                            Design Now
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      {/* ── Have Your Own Artwork? ─────────────────────────────────── */}
      <section className="bg-gray-950 py-14 sm:py-18 border-t border-gray-800">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Have Your Own Artwork?
            </h2>
            <p className="text-gray-400 mb-6">
              If you already have print-ready artwork, skip the editor and
              submit your files directly with a quote request. We accept AI,
              PSD, PDF, EPS, and high-resolution PNG/JPEG files.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
              >
                Request a Quote
              </Link>
              <Link
                href="/quote/builder"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg border border-gray-700 transition-colors"
              >
                Use Quote Builder
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
