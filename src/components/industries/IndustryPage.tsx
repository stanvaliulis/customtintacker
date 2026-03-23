import Link from 'next/link';
import Container from '@/components/ui/Container';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { IndustryData } from '@/data/industries';
import {
  Beer,
  Wine,
  Leaf,
  UtensilsCrossed,
  Coffee,
  Trophy,
  Sparkles,
  ArrowRight,
  Send,
  Factory,
  Truck,
  CheckCircle2,
} from 'lucide-react';

const iconMap = {
  beer: Beer,
  glass: Wine,
  leaf: Leaf,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  trophy: Trophy,
};

interface IndustryPageProps {
  industry: IndustryData;
}

export default function IndustryPage({ industry }: IndustryPageProps) {
  const IndustryIcon = iconMap[industry.benefits[0]?.icon || 'beer'];

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: industry.breadcrumbLabel, url: `${siteConfig.url}/${industry.slug}` },
        ])}
      />

      {/* ── Hero Section ─────────────────────────────────────────────── */}
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

        <Container className="relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <IndustryIcon className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                {industry.name}
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              {industry.headline.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                {industry.headline.split(' ').slice(-1)}
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              {industry.heroSubtext}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 transition-colors font-semibold px-6 py-3 rounded-lg text-base"
              >
                See Our Signs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 border-2 border-amber-500/40 text-amber-400 hover:border-amber-400 hover:text-amber-300 transition-colors font-semibold px-6 py-3 rounded-lg text-base"
              >
                Get a Free Quote
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500/60" />
                25 minimum order
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>~15 business day lead time</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Made in USA</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Benefits Section ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Why Tin Tackers for{' '}
              <span className="text-amber-400">{industry.name}</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              {industry.useCases}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industry.benefits.map((benefit, i) => {
              const BenefitIcon = iconMap[benefit.icon];
              return (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-6 hover:border-amber-500/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                    <BenefitIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Popular Shapes Section ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Popular Shapes for{' '}
              <span className="text-amber-400">{industry.name}</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              These are our most popular tin tacker shapes for {industry.name.toLowerCase()}. Every shape is fully customizable with your artwork.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industry.recommendedProducts.map((product, i) => (
              <Link
                key={i}
                href={`/products/${product.slug}`}
                className="group bg-gray-900/60 border border-gray-800/50 rounded-xl p-6 hover:border-amber-500/30 transition-all hover:bg-gray-900/80"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-amber-400/70 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    {product.shape}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{product.description}</p>
                <span className="text-amber-400 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-2 transition-colors"
            >
              Browse all shapes and sizes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ── How It Works Section ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How It <span className="text-amber-400">Works</span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Getting custom tin tackers is dead simple. Three steps and you are done.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Send Us Your Artwork',
                description:
                  'Upload your logo, label, or design. No design? No problem — we offer free design proofs and can work from rough ideas, photos, or sketches.',
                Icon: Send,
              },
              {
                step: '2',
                title: 'We Make Your Signs',
                description:
                  'Your artwork gets printed in full color onto embossed recycled aluminum. Each sign is individually shrink-wrapped and inspected before shipping.',
                Icon: Factory,
              },
              {
                step: '3',
                title: 'Ships in ~15 Business Days',
                description:
                  'Standard production is about 15 business days. Larger orders may require additional time. We ship directly to you (or your distributor, your accounts, wherever you need them).',
                Icon: Truck,
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <item.Icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-amber-400 text-sm font-bold mb-2">Step {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Pricing Snippet ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-gray-800/50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Factory-Direct <span className="text-amber-400">Pricing</span>
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              Tin tackers start at{' '}
              <span className="text-amber-400 font-bold text-2xl">{industry.pricingStart}</span>{' '}
              per sign at volume. Price depends on shape, size, and quantity. Minimum order is 25 units on most shapes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-8">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500/60" />
                No setup fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500/60" />
                Free design proofs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500/60" />
                Bulk discounts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500/60" />
                Distributor pricing available
              </span>
            </div>
            <Link
              href="/products"
              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-2 transition-colors"
            >
              See full pricing for every shape <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="border-t border-gray-800/50">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700">
          <Container className="py-14 sm:py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {industry.ctaText}
              </h2>
              <p className="text-amber-100/80 text-lg mb-8">
                Get a free quote with a design proof. No commitment, no hassle. Just tell us what you need and we will take it from there.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 bg-white text-amber-700 hover:bg-amber-50 transition-colors font-semibold px-8 py-3.5 rounded-lg text-lg"
                >
                  Get a Free Quote
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-white/40 text-white hover:border-white hover:bg-white/10 transition-colors font-semibold px-8 py-3.5 rounded-lg text-lg"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </Container>
        </div>
      </section>
    </div>
  );
}
