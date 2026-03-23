import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import GalleryFilterBar from '@/components/gallery/GalleryFilterBar';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import {
  galleryItems,
  GalleryItem,
  GalleryIndustry,
  GalleryShape,
} from '@/data/gallery';
import {
  ImageIcon,
  Camera,
  Sparkles,
  ArrowRight,
  Square,
  Circle,
  Hexagon,
  Star,
  Tag,
} from 'lucide-react';

export const metadata: Metadata = {
  title:
    'Custom Tin Tacker Gallery | See Our Work | Embossed Aluminum Sign Examples',
  description:
    'Browse our gallery of custom embossed aluminum tin tacker signs made for breweries, bars, restaurants, cannabis brands, coffee shops, and sports venues. See real examples of bottle cap, circle, square, street sign, arrow, and custom die-cut tin tackers. Get inspired for your next order.',
  keywords: [
    'tin tacker examples',
    'custom sign gallery',
    'embossed aluminum sign examples',
    'tin tacker gallery',
    'bar sign examples',
    'brewery sign gallery',
    'custom tin tacker photos',
    'bottle cap sign examples',
    'can shape tin tacker',
    'tin tacker showcase',
    'aluminum sign portfolio',
  ],
  openGraph: {
    title: 'Custom Tin Tacker Gallery | See Our Work',
    description:
      'Browse real tin tacker signs we have made for breweries, bars, restaurants, and brands. Get inspired for your next custom embossed aluminum sign.',
    url: `${siteConfig.url}/gallery`,
  },
  alternates: {
    canonical: `${siteConfig.url}/gallery`,
  },
};

/** Map shapes to icons for the placeholder cards */
function shapeIcon(shape: GalleryShape) {
  switch (shape) {
    case 'Circle':
      return <Circle className="w-10 h-10" />;
    case 'Bottle Cap':
      return <Star className="w-10 h-10" />;
    case 'Custom Die-Cut':
      return <Hexagon className="w-10 h-10" />;
    default:
      return <Square className="w-10 h-10" />;
  }
}

/** Industry badge colour */
function industryColor(industry: GalleryIndustry): string {
  const map: Record<GalleryIndustry, string> = {
    Brewery: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Bar: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Restaurant: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Cannabis: 'bg-green-500/10 text-green-400 border-green-500/20',
    Coffee: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Sports: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return map[industry];
}

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function GalleryPage({ searchParams }: Props) {
  const params = await searchParams;
  const industryFilter = (params.industry || '') as GalleryIndustry | '';
  const shapeFilter = (params.shape || '') as GalleryShape | '';

  let items: GalleryItem[] = galleryItems;
  if (industryFilter) {
    items = items.filter((i) => i.industry === industryFilter);
  }
  if (shapeFilter) {
    items = items.filter((i) => i.shape === shapeFilter);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Gallery', url: `${siteConfig.url}/gallery` },
        ])}
      />

      {/* ───── Hero ───── */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
          }}
        />

        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                Our Work
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              The{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Gallery
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Real tin tackers we&apos;ve made for real brands. From breweries
              to dispensaries, every sign is custom-built, embossed, and shipped
              ready to hang.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500/60" />
                {galleryItems.length} projects showcased
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>6 industries</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Made in USA</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ───── Filter Bar ───── */}
      <section className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-16 z-20">
        <Container className="py-4">
          <Suspense>
            <GalleryFilterBar />
          </Suspense>
        </Container>
      </section>

      {/* ───── Gallery Grid ───── */}
      <section className="py-10 sm:py-14">
        <Container>
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                No gallery items match your filters.
              </p>
              <Link
                href="/gallery"
                className="mt-4 inline-block text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, idx) => (
                <GalleryCard key={item.id} item={item} index={idx} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="border-t border-gray-800/50">
        <Container className="py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Want to see your brand{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              here?
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Get started today and join the brands that trust us to make their
            signage unforgettable.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-lg"
            >
              Get a Free Quote
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/samples"
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-amber-600 text-amber-400 font-semibold rounded-lg hover:bg-amber-600/10 transition-colors text-lg"
            >
              Order a Sample Pack
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

/* ─── Gallery Card Component ─── */

function GalleryCard({ item, index }: { item: GalleryItem; index: number }) {
  // Vary heights for masonry-like visual interest
  const heights = ['h-52', 'h-60', 'h-48', 'h-56', 'h-64', 'h-44'];
  const heightClass = heights[index % heights.length];

  return (
    <div className="group rounded-xl overflow-hidden bg-gray-900/60 border border-gray-800/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
      {/* Image placeholder */}
      <div
        className={`relative ${heightClass} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden`}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(245,158,11,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(245,158,11,0.1) 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="relative text-gray-600 group-hover:text-amber-500/50 transition-colors duration-300">
          {shapeIcon(item.shape)}
        </div>

        {/* Industry badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${industryColor(item.industry)}`}
          >
            <Tag className="w-3 h-3" />
            {item.industry}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="text-white font-bold text-lg leading-tight group-hover:text-amber-400 transition-colors">
          {item.brandName}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {item.shape} &middot; {item.size}
        </p>
        <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
          {item.description}
        </p>
      </div>
    </div>
  );
}
