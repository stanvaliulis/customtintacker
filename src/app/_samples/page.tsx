import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import SampleOrderForm from '@/components/samples/SampleOrderForm';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import {
  Package,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Truck,
  BadgeDollarSign,
  Palette,
  Layers,
  Boxes,
  HelpCircle,
  ChevronDown,
  Shield,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title:
    'Order Tin Tacker Samples | Feel the Quality Before You Buy',
  description:
    'Order a custom tin tacker sample pack and experience the quality of our embossed aluminum signs before placing a full order. Basic, variety, and custom sample packs available. 100% of the sample cost is credited toward your first order of 100+ units. Ships in 5-7 business days.',
  keywords: [
    'tin tacker sample',
    'order sample sign',
    'tin tacker quality',
    'sample tin tacker pack',
    'try tin tackers',
    'embossed aluminum sample',
    'tin tacker sample order',
    'custom sign sample',
    'bar sign sample',
    'brewery sign sample',
  ],
  openGraph: {
    title: 'Order Tin Tacker Samples | Feel the Quality Before You Buy',
    description:
      'Try before you buy. Order a tin tacker sample pack and feel the embossed aluminum quality for yourself. 100% of sample cost credited toward your first order.',
    url: `${siteConfig.url}/samples`,
  },
  alternates: {
    canonical: `${siteConfig.url}/samples`,
  },
};

/* ─── Sample pack definitions ─── */
const samplePacks = [
  {
    id: 'basic',
    name: 'Basic Sample',
    price: '$15',
    icon: <Package className="w-7 h-7" />,
    description: '1 sample tin tacker printed with our house design.',
    includes: [
      'One 14" x 14" embossed tin tacker',
      'Our stock design (or choose a shape)',
      'Free standard shipping',
    ],
    highlight: false,
  },
  {
    id: 'variety',
    name: 'Variety Pack',
    price: '$35',
    icon: <Boxes className="w-7 h-7" />,
    description: '3 samples in different shapes so you can compare.',
    includes: [
      'Three tin tackers in different shapes',
      'Square, circle, and a specialty shape',
      'Free standard shipping',
    ],
    highlight: true,
  },
  {
    id: 'custom',
    name: 'Custom Sample',
    price: '$25',
    icon: <Palette className="w-7 h-7" />,
    description: 'We print YOUR artwork on a sample tin tacker.',
    includes: [
      'One tin tacker with your custom art',
      'Your choice of shape and size',
      'Free standard shipping',
    ],
    highlight: false,
  },
];

/* ─── How it works steps ─── */
const steps = [
  {
    step: '1',
    title: 'Place Your Order',
    description: 'Choose a sample pack and fill out the form below.',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    step: '2',
    title: 'We Make It',
    description: 'Your sample is printed and embossed in our Machesney Park facility.',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    step: '3',
    title: 'Ships Fast',
    description: 'Your sample ships in 5-7 business days, faster than custom orders.',
    icon: <Truck className="w-6 h-6" />,
  },
];

/* ─── FAQ ─── */
const faqs = [
  {
    q: 'Can I apply the sample cost to my first order?',
    a: 'Yes! 100% of your sample pack cost is credited toward your first production order of 100 or more units. Think of it as a risk-free preview.',
  },
  {
    q: 'What shapes are available for samples?',
    a: 'We can send samples in square, circle, bottle cap, can shape, street sign, arrow, and license plate formats. Custom die-cut shapes require a production order.',
  },
  {
    q: 'Can I get samples in different gauges?',
    a: 'Our samples ship in our standard .024" recycled aluminum gauge, which is the same material used in production orders. If you need a specific gauge, let us know in the notes field.',
  },
  {
    q: 'How long does shipping take?',
    a: 'Sample packs ship within 5-7 business days from our facility in Machesney Park, IL. Standard ground shipping is included at no extra cost.',
  },
  {
    q: 'Can I send my own artwork for the custom sample?',
    a: 'Absolutely. After you submit the order, we will reach out via email to collect your artwork file. We accept AI, PDF, EPS, and high-res PNG/JPG formats.',
  },
];

export default function SamplesPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Samples', url: `${siteConfig.url}/samples` },
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
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                Sample Packs
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Feel the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Quality
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Order a sample pack and see for yourself why brands choose our tin
              tackers. Hold it, hang it, show it off&mdash;then decide.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <BadgeDollarSign className="w-4 h-4 text-amber-500/60" />
                From $15
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Free shipping</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Ships in 5-7 days</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ───── Sample Pack Options ───── */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Choose Your Sample Pack
            </h2>
            <p className="mt-3 text-gray-400 text-lg max-w-xl mx-auto">
              Every pack includes free shipping. 100% of the cost is credited
              toward your first production order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {samplePacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-2xl p-6 border transition-all ${
                  pack.highlight
                    ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5'
                    : 'bg-gray-900/60 border-gray-800/50 hover:border-gray-700'
                }`}
              >
                {pack.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-gray-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      <Star className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    pack.highlight
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {pack.icon}
                </div>

                <h3 className="text-xl font-bold text-white">{pack.name}</h3>
                <p className="text-3xl font-extrabold text-amber-400 mt-1">
                  {pack.price}
                </p>
                <p className="mt-2 text-sm text-gray-400">{pack.description}</p>

                <ul className="mt-5 space-y-2">
                  {pack.includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href="#order-form"
                  className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    pack.highlight
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Order This Pack
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ───── How It Works ───── */}
      <section className="py-14 sm:py-20 border-t border-gray-800/50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
                  {s.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-500/60 mb-1">
                  Step {s.step}
                </p>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{s.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ───── Trust / Credit Banner ───── */}
      <section className="border-t border-gray-800/50 bg-amber-500/5">
        <Container className="py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                100% of the sample cost is credited toward your first order of
                100+ units
              </h3>
              <p className="mt-1 text-gray-400">
                There&apos;s no risk. If you love the quality (and you will),
                your sample investment rolls straight into your production
                order. It&apos;s basically a free preview.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ───── FAQ ───── */}
      <section className="py-14 sm:py-20 border-t border-gray-800/50">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-amber-400 mb-3">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-widest">
                  FAQ
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                Common Questions
              </h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-xl bg-gray-900/60 border border-gray-800/50 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-white font-medium hover:text-amber-400 transition-colors list-none">
                    {faq.q}
                    <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                  </summary>
                  <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ───── Order Form ───── */}
      <section
        id="order-form"
        className="py-14 sm:py-20 border-t border-gray-800/50"
      >
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Order Your Sample Pack
              </h2>
              <p className="mt-3 text-gray-400 max-w-lg mx-auto">
                Fill out the form below and we&apos;ll follow up with payment
                details and get your sample made.
              </p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6 sm:p-8">
              <SampleOrderForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
