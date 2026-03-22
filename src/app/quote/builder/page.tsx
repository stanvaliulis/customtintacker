import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import QuoteBuilder from '@/components/quote/QuoteBuilder';

export const metadata: Metadata = {
  title: 'Tin Tacker Quote Builder | Configure & Price Custom Embossed Aluminum Signs',
  description:
    'Build your custom tin tacker sign and get instant pricing with our interactive quote builder. Choose tin tacker shape, size, gauge, backing, and quantity. Square, circle, can shape, bottle cap, and die-cut tin tacker options with real-time bulk pricing. Made in USA by Interstate Graphics.',
  keywords: [
    'tin tacker quote builder',
    'tin tacker configurator',
    'tin tacker instant pricing',
    'custom tin tacker builder',
    'embossed sign pricing tool',
    'tin tacker price calculator',
  ],
  openGraph: {
    title: 'Tin Tacker Quote Builder | Configure & Price Custom Embossed Aluminum Signs',
    description:
      'Interactive quote builder for custom embossed aluminum tin tacker signs. Instant pricing on all shapes and sizes from Interstate Graphics.',
    url: 'https://customtintackers.com/quote/builder',
  },
  alternates: {
    canonical: 'https://customtintackers.com/quote/builder',
  },
};

export default function QuoteBuilderPage() {
  return (
    <section className="py-10 sm:py-14 bg-gray-50 min-h-screen">
      <Container>
        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Build Your Custom Tin Tacker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure your sign step-by-step and get an instant quote. All signs are
            made from recycled embossed aluminum with full-color printing, right here
            in the USA.
          </p>
        </div>

        {/* Builder */}
        <QuoteBuilder />
      </Container>
    </section>
  );
}
