import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import QuoteForm from '@/components/forms/QuoteForm';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';

export const metadata: Metadata = {
  title: 'Get a Free Tin Tacker Quote | Custom Embossed Aluminum Sign Pricing',
  description:
    'Request a free quote for custom tin tacker signs. Embossed aluminum tin tackers in every shape and size with bulk pricing from $3.50/unit. Custom die-cuts, squares, circles, bottle caps, and can shapes available. Response within 1 business day. Made in USA by Interstate Graphics, Machesney Park, IL.',
  keywords: [
    'tin tacker quote',
    'tin tacker pricing',
    'custom tin tacker pricing',
    'tin tacker bulk pricing',
    'tin tacker cost',
    'embossed sign quote',
    'custom sign quote',
    'free quote tin tackers',
    'order tin tackers',
    'tin tacker estimate',
    'how much do tin tackers cost',
  ],
  openGraph: {
    title: 'Get a Free Tin Tacker Quote | Custom Embossed Aluminum Sign Pricing',
    description:
      'Request a free quote for custom embossed aluminum tin tacker signs. Bulk pricing, custom shapes, sizes, and die-cuts available. Fast response within 1 business day from Interstate Graphics.',
    url: 'https://customtintackers.com/quote',
  },
  alternates: {
    canonical: 'https://customtintackers.com/quote',
  },
};

export default function QuotePage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Request a Quote', url: `${siteConfig.url}/quote` },
        ])}
      />
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Request a Quote</h1>
            <p className="text-lg text-gray-600">
              Need a custom size, shape, or large volume order? Fill out the form below and our team will get back to you within 1 business day with a detailed quote.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
            <QuoteForm />
          </div>
        </div>
      </Container>
    </section>
    </>
  );
}
