import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import { siteConfig } from '@/data/siteConfig';
import { Clock, Truck, PackageCheck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tin Tacker Shipping & Returns | Production Timeline & Delivery Info',
  description:
    'Shipping information and return policy for custom tin tacker signs by Interstate Graphics. Tin tacker production takes approximately 30 days. Nationwide shipping via UPS and FedEx. Learn about delivery timelines, damage claims, and our quality guarantee on all embossed aluminum tin tackers.',
  openGraph: {
    title: 'Tin Tacker Shipping & Returns | Production Timeline & Delivery Info',
    description:
      'Production timelines, shipping details, and return policy for custom embossed aluminum tin tacker signs from Interstate Graphics.',
    url: 'https://customtintackers.com/shipping',
  },
  alternates: {
    canonical: 'https://customtintackers.com/shipping',
  },
};

const highlights = [
  {
    icon: Clock,
    title: '~30 Day Production',
    description:
      'Each order is custom manufactured from scratch. Plan for approximately 30 days from proof approval to shipment.',
  },
  {
    icon: Truck,
    title: 'Nationwide Shipping',
    description:
      'We ship to all 50 states via trusted carriers. International shipping available on request.',
  },
  {
    icon: PackageCheck,
    title: 'Individually Wrapped',
    description:
      'Every sign is individually wrapped and carefully packed to arrive in perfect condition.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    description:
      'If your signs arrive defective or damaged, we will make it right. That is our promise.',
  },
];

export default function ShippingPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Shipping &amp; Returns
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Everything you need to know about how your tin tackers get from our
            factory to your door &mdash; and what happens if something
            isn&apos;t right.
          </p>

          {/* Highlight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-14">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                  <h.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {h.title}
                </h3>
                <p className="text-gray-600 text-sm">{h.description}</p>
              </div>
            ))}
          </div>

          {/* Detailed sections */}
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Production Timeline
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                All of our tin tacker signs are custom-manufactured, which means
                each order goes through tooling, printing, embossing, and
                finishing before it ships. Here&apos;s what to expect:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Standard production:</strong> approximately 30
                  business days from proof approval and payment.
                </li>
                <li>
                  <strong>Rush production:</strong> approximately 15 business
                  days from proof approval and payment. Rush processing is
                  available on all orders for an additional 25% fee, which you
                  can select when adding items to your cart or building a quote.
                </li>
                <li>
                  Production does not begin until you approve your digital proof
                  and payment is received. The sooner you approve, the sooner
                  we start.
                </li>
                <li>
                  We&apos;ll notify you when your order ships and provide
                  tracking information.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Shipping Methods and Delivery
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Once your signs are produced, we get them out the door quickly:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Standard shipping:</strong> UPS or FedEx Ground.
                  Typical transit time is 3&ndash;7 business days depending on
                  your location.
                </li>
                <li>
                  <strong>Expedited shipping:</strong> available at an
                  additional cost if you need faster delivery after production.
                </li>
                <li>
                  <strong>Freight/LTL:</strong> for very large orders, we may
                  ship via freight carrier. We&apos;ll coordinate delivery
                  details with you.
                </li>
                <li>
                  <strong>International shipping:</strong> available on a
                  case-by-case basis.{' '}
                  <a
                    href="/contact"
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    Contact us
                  </a>{' '}
                  for a shipping quote.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Shipping costs are calculated based on order size, weight, and
                destination. You&apos;ll see shipping costs before you finalize
                your order or they&apos;ll be included in your quote.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Packaging
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We know these signs need to arrive looking perfect. Each tin
                tacker is individually wrapped and packed in sturdy cartons
                designed to prevent bending, scratching, or other damage during
                transit. For larger orders, signs are palletized and
                shrink-wrapped.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Returns Policy
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Because every tin tacker is custom-made to your exact
                specifications, we cannot accept returns simply because you
                changed your mind or no longer need them. We know that sounds
                strict, but custom manufacturing means we can&apos;t resell your
                signs to someone else.
              </p>
              <p className="text-gray-600 leading-relaxed font-medium mb-3">
                That said, we absolutely stand behind the quality of our work.
                We will replace or refund your order if:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  The signs have manufacturing defects (wrong colors,
                  misprints, embossing issues, etc.)
                </li>
                <li>
                  We shipped the wrong product, wrong quantity, or wrong design
                </li>
                <li>
                  The signs were damaged during production (not shipping &mdash;
                  see below for shipping damage)
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Damage Claims
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If your signs arrive damaged from shipping, here&apos;s what to
                do:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Inspect your shipment</strong> as soon as it arrives.
                  If the outer packaging is visibly damaged, note it with the
                  delivery driver if possible.
                </li>
                <li>
                  <strong>Take photos</strong> of the damaged packaging and any
                  damaged signs. The more documentation, the better.
                </li>
                <li>
                  <strong>Contact us within 7 days</strong> of delivery through our{' '}
                  <a
                    href="/contact"
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    contact form
                  </a>{' '}
                  with your order number and photos.
                </li>
                <li>
                  <strong>Keep the packaging</strong> &mdash; the carrier may
                  need to inspect it as part of the claims process.
                </li>
              </ol>
              <p className="text-gray-600 leading-relaxed mt-3">
                We&apos;ll work with the shipping carrier to file a claim and
                get your replacement signs produced as quickly as possible.
              </p>
            </div>

            <div className="bg-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Questions About Your Order?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Whether you&apos;re wondering about production status, shipping
                options, or need to report an issue, we&apos;re here to help.
                Reach out through our{' '}
                <a
                  href="/contact"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  contact form
                </a>{' '}
                or call{' '}
                <a
                  href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`}
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {siteConfig.phone}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
