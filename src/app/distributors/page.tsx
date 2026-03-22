import { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import DistributorPricingTable from '@/components/distributors/DistributorPricingTable';
import JsonLd from '@/components/seo/JsonLd';
import { getFAQSchema, getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { products } from '@/data/products';
import {
  DollarSign,
  Truck,
  PackageCheck,
  Image,
  ClipboardCheck,
  LogIn,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wholesale Tin Tackers Distributor Program | ASI SAGE PPAI Tin Tacker Signs',
  description:
    'Become a wholesale tin tacker distributor with Custom Tin Tackers by Interstate Graphics. ASI, SAGE, and PPAI promotional products distributors get up to 30% off embossed aluminum tin tacker signs. Blind dropship, marketing support, and low minimums. Premium tin tackers made in USA.',
  keywords: [
    'wholesale tin tackers',
    'tin tacker distributor',
    'ASI distributor tin tackers',
    'SAGE distributor tin tackers',
    'PPAI distributor tin tackers',
    'promotional products distributor',
    'tin tacker signs wholesale',
    'distributor pricing tin tackers',
    'embossed aluminum signs wholesale',
    'promotional product signs',
    'blind dropship tin tackers',
    'tin tacker reseller',
    'bulk embossed signs',
    'promotional signs distributor',
    'wholesale embossed aluminum signs',
  ],
  openGraph: {
    title: 'Wholesale Tin Tackers Distributor Program | ASI SAGE PPAI Tin Tacker Signs',
    description:
      'Join our distributor program for exclusive wholesale pricing on premium embossed aluminum tin tacker signs. Up to 30% off retail with blind dropship available.',
    url: 'https://customtintackers.com/distributors',
  },
  alternates: {
    canonical: 'https://customtintackers.com/distributors',
  },
};

const benefits = [
  {
    icon: DollarSign,
    title: 'Distributor Pricing',
    description:
      'Up to 30% off retail pricing tiers. The more your clients order, the more you save. Volume discounts stack with your distributor rate.',
  },
  {
    icon: Truck,
    title: 'Dropship Program',
    description:
      'Ship directly to your customers with your branding. Blind shipping available on every order with no additional fees.',
  },
  {
    icon: PackageCheck,
    title: 'No Minimum Hassle',
    description:
      'Low 25-unit minimums per design. Perfect for testing new products with clients or running smaller promotional campaigns.',
  },
  {
    icon: Image,
    title: 'Marketing Support',
    description:
      'Product images, catalogs, and sales sheets provided. Everything you need to present tin tackers to your clients professionally.',
  },
];

const steps = [
  {
    icon: ClipboardCheck,
    step: '1',
    title: 'Apply & Get Approved',
    description:
      'Submit your application with your ASI, SAGE, or PPAI number. We review and approve most applications within 1 business day.',
  },
  {
    icon: LogIn,
    step: '2',
    title: 'Access Distributor Pricing',
    description:
      'Log into your distributor portal to see your custom pricing, download marketing materials, and access order tools.',
  },
  {
    icon: ShoppingBag,
    step: '3',
    title: 'Order & We Ship',
    description:
      'Place orders through the portal or via your dedicated rep. We handle all production and fulfillment, including blind dropship.',
  },
];

const faqs = [
  {
    question: 'What qualifies me for distributor pricing?',
    answer:
      'You must be a registered promotional products distributor with an active ASI, SAGE, or PPAI membership. We verify all numbers during the application process.',
  },
  {
    question: 'How much is the distributor discount?',
    answer:
      'Distributors receive up to 30% off our published retail pricing tiers. Your exact discount depends on account volume and tier level. Contact us for a detailed pricing sheet.',
  },
  {
    question: 'Do you offer blind dropshipping?',
    answer:
      'Yes. We can ship directly to your end customer with no Interstate Graphics branding on the packaging. Packing slips can be customized or omitted entirely.',
  },
  {
    question: 'What are the minimum order quantities?',
    answer:
      'Our standard minimum is 25 units per design. Custom die-cut shapes have a 50-unit minimum. There are no overall account minimums to maintain your distributor status.',
  },
  {
    question: 'What is the typical production lead time?',
    answer:
      'Standard shapes ship in approximately 3-4 weeks after art approval. Custom die-cut shapes require 4-6 weeks. Rush production is available for an additional fee.',
  },
  {
    question: 'Do you provide product samples?',
    answer:
      'Yes, we offer a distributor sample kit with one of each standard size and shape. Contact your rep or request samples during the application process.',
  },
  {
    question: 'Can I use my own artwork and designs?',
    answer:
      'Absolutely. Most distributors supply their client\'s artwork. We accept AI, EPS, PDF, and high-resolution PNG/JPG files. Our art department can also assist with setup at no extra charge.',
  },
  {
    question: 'Are your products PPAI/SAGE compliant for reporting?',
    answer:
      'Yes. We provide all necessary product data, pricing, and compliance information for ASI, SAGE, and PPAI reporting and catalog listings.',
  },
];

export default function DistributorsPage() {
  // Use the 12x12 tacker as the example product for the pricing table
  const exampleProduct = products.find((p) => p.slug === '12x12-embossed-tacker')!;

  return (
    <>
      <JsonLd data={getFAQSchema(faqs)} />
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Distributors', url: `${siteConfig.url}/distributors` },
        ])}
      />
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-16 sm:py-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-4">
              ASI / SAGE / PPAI Distributors
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Partner With Us</h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8">
              Grow your signage business with premium embossed aluminum tin tacker signs.
              We give promotional products distributors the pricing, tools, and support
              they need to win more business and delight their clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/distributors/apply">
                <Button size="lg">Apply Now</Button>
              </Link>
              <Link href="#benefits">
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits Grid */}
      <section id="benefits" className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Distributors Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We have built our distributor program around the things that matter most to
              promotional products professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting started as a distributor is simple. We handle the heavy lifting so you can
              focus on selling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-bold text-amber-600 mb-1">Step {s.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Distributor Pricing Example</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how distributor pricing compares to retail on our most popular product.
              Your actual discount may be higher based on volume commitments.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <DistributorPricingTable
              productName={exampleProduct.name + ' (Standard .024" Gauge)'}
              pricingTiers={exampleProduct.pricingTiers}
              discountPercent={30}
            />
            <p className="text-center text-sm text-gray-500 mt-4">
              Pricing shown reflects a 30% distributor discount. All prices are per unit.
              Setup fees and backing upgrades are additional. Contact us for a complete price list.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA / Application Section */}
      <section className="py-16 sm:py-20 bg-gray-900 text-white">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Join hundreds of promotional products distributors who already partner with us.
              Submit your application today and start offering premium tin tacker signs to
              your clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/distributors/apply">
                <Button size="lg">Apply as Distributor</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white">
                  Contact Sales Team
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Common questions from promotional products distributors.
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-6">
                <h3 className="text-base font-semibold text-gray-900 flex items-start gap-3">
                  <ChevronDown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed pl-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
