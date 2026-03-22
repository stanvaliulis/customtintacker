import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import { siteConfig } from '@/data/siteConfig';

export const metadata: Metadata = {
  title: 'Terms of Service | Custom Tin Tackers by Interstate Graphics',
  description:
    'Terms of service for Custom Tin Tackers by Interstate Graphics. Covers tin tacker ordering, pricing, production timelines, shipping, returns, and custom embossed aluminum sign policies.',
  openGraph: {
    title: 'Terms of Service | Custom Tin Tackers by Interstate Graphics',
    description:
      'Terms and conditions for ordering custom embossed aluminum tin tacker signs from Custom Tin Tackers by Interstate Graphics.',
    url: 'https://customtintackers.com/terms',
  },
  alternates: {
    canonical: 'https://customtintackers.com/terms',
  },
};

export default function TermsPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Last updated: March 21, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Overview
              </h2>
              <p className="text-gray-600 leading-relaxed">
                These terms apply when you use the {siteConfig.name} website or
                place an order with {siteConfig.company}. By using our site or
                ordering from us, you agree to these terms. We&apos;ve tried to
                keep them straightforward &mdash; if anything is unclear, just{' '}
                <a
                  href="/contact"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  contact us
                </a>{' '}
                and we&apos;ll be happy to clarify.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Orders and Pricing
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                All of our tin tacker signs are custom-made to order. Here&apos;s
                what you should know:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Minimum order quantity</strong> is 25 units per design.
                  This is because each order requires custom tooling and setup.
                </li>
                <li>
                  Pricing is based on the sign type, size, quantity, and any
                  special finishing options. Larger orders get better per-unit
                  pricing.
                </li>
                <li>
                  Prices on the website are subject to change. The price you see
                  at the time you place your order (or on your approved quote) is
                  the price you pay.
                </li>
                <li>
                  We may decline any order at our discretion &mdash; for example,
                  if the artwork contains content we can&apos;t produce or if
                  there&apos;s a pricing error on the site.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Artwork and Proofs
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Since every sign is custom, you&apos;ll need to provide artwork
                or work with our team on a design. A few things to keep in mind:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  You&apos;re responsible for making sure you have the rights to
                  use any logos, images, or designs you send us. We produce what
                  you provide, so please don&apos;t submit artwork you
                  don&apos;t own.
                </li>
                <li>
                  We&apos;ll send you a digital proof before production begins.
                  Once you approve the proof, we start manufacturing. Changes
                  after proof approval may result in additional charges or
                  delays.
                </li>
                <li>
                  Color matching: we do our best to match your colors, but
                  embossed aluminum printing can vary slightly from screen
                  colors. If you need exact PMS color matching, let us know
                  upfront.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Production and Delivery Timeline
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Standard production time is approximately 30 days from proof
                approval. This can vary depending on order size and current
                production schedules.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  Production does not start until your proof is approved and
                  payment is received.
                </li>
                <li>
                  Rush orders may be available for an additional fee &mdash;
                  contact us to discuss your timeline.
                </li>
                <li>
                  We&apos;ll keep you updated on your order status, but
                  production timelines are estimates, not guarantees. Things like
                  material availability can occasionally cause delays.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Payment
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Payment is due at the time of order unless other arrangements
                have been made (e.g., for wholesale or distributor accounts). We
                accept major credit cards through our secure payment processor,
                Stripe. For large orders, we may offer net payment terms on a
                case-by-case basis.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Shipping
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We ship to addresses within the United States. International
                shipping may be available &mdash; contact us for a quote. Each
                sign is individually wrapped to prevent damage during transit.
                Shipping costs depend on order size and destination. For more
                details, see our{' '}
                <a
                  href="/shipping"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  Shipping &amp; Returns
                </a>{' '}
                page.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Returns and Refunds
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Because every tin tacker is custom-made to your specifications,
                we generally cannot accept returns or offer refunds on completed
                orders. However, we stand behind our work:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Defective products</strong> &mdash; if your signs
                  arrive with manufacturing defects (misprints, wrong colors,
                  physical damage from production), we&apos;ll replace them at no
                  cost.
                </li>
                <li>
                  <strong>Wrong order</strong> &mdash; if we ship the wrong
                  product or quantity, we&apos;ll make it right.
                </li>
                <li>
                  <strong>Shipping damage</strong> &mdash; if signs are damaged
                  during shipping, contact us within 7 days of delivery with
                  photos and we&apos;ll work with the carrier to resolve it.
                </li>
                <li>
                  We cannot offer refunds for buyer&apos;s remorse, design
                  changes after proof approval, or issues that were visible on
                  the approved proof.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Intellectual Property
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You retain ownership of any artwork, logos, and designs you
                provide to us. By submitting artwork, you grant us a limited
                license to use it solely for the purpose of producing your
                order. We won&apos;t use your designs for any other purpose
                without your permission. The {siteConfig.name} website content,
                branding, and design are the property of {siteConfig.company}.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We do our best to deliver great products and a smooth experience,
                but we&apos;re a sign manufacturer, not a law firm, so
                here&apos;s the practical version: our liability for any order is
                limited to the amount you paid for that order. We&apos;re not
                responsible for indirect damages like lost profits, missed
                deadlines for events, or any other consequential losses. If
                something goes wrong, we&apos;ll work with you in good faith to
                make it right.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Changes to These Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update these terms from time to time. When we do,
                we&apos;ll update the date at the top of this page. Continued
                use of our site after changes means you accept the updated
                terms.
              </p>
            </div>

            <div className="bg-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Questions About These Terms?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Reach out to us at{' '}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {siteConfig.email}
                </a>{' '}
                or call{' '}
                <a
                  href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, '')}`}
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  {siteConfig.phone}
                </a>
                . We&apos;re happy to walk you through anything.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
