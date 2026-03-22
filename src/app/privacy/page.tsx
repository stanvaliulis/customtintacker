import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import { siteConfig } from '@/data/siteConfig';

export const metadata: Metadata = {
  title: 'Privacy Policy | Custom Tin Tackers by Interstate Graphics',
  description:
    'Privacy policy for Custom Tin Tackers by Interstate Graphics. Learn how we collect, use, and protect your information when you browse tin tackers, request quotes, or place an order.',
  openGraph: {
    title: 'Privacy Policy | Custom Tin Tackers by Interstate Graphics',
    description:
      'How Custom Tin Tackers by Interstate Graphics collects, uses, and protects your information.',
    url: 'https://customtintackers.com/privacy',
  },
  alternates: {
    canonical: 'https://customtintackers.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Last updated: March 21, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Who We Are
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {siteConfig.name} is operated by {siteConfig.company}. When we
                say &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;
                on this page, we mean {siteConfig.company}. We take your privacy
                seriously and want to be upfront about what information we
                collect and why.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                What We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We only collect information that we actually need to process your
                orders, respond to your inquiries, and keep our site running
                properly. Here&apos;s the breakdown:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Contact information</strong> &mdash; name, email,
                  phone number, and company name when you submit a contact form,
                  request a quote, or place an order.
                </li>
                <li>
                  <strong>Shipping details</strong> &mdash; your address so we
                  can deliver your signs.
                </li>
                <li>
                  <strong>Order information</strong> &mdash; what you ordered,
                  quantities, artwork files, and any special instructions.
                </li>
                <li>
                  <strong>Payment information</strong> &mdash; processed
                  securely through Stripe. We never see or store your full credit
                  card number.
                </li>
                <li>
                  <strong>Usage data</strong> &mdash; basic analytics like pages
                  visited and browser type, collected through cookies to help us
                  improve the site.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Processing and fulfilling your orders</li>
                <li>Responding to your questions and quote requests</li>
                <li>Sending order updates and shipping notifications</li>
                <li>Improving our website and products</li>
                <li>
                  Complying with legal obligations (taxes, records, etc.)
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                We don&apos;t sell your personal information to anyone. Period.
                We don&apos;t rent it out, either. Your data is used to serve you
                and that&apos;s it.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our site uses cookies for basic functionality like keeping your
                cart contents intact, remembering your session, and understanding
                how visitors use the site. You can disable cookies in your
                browser settings, but some parts of the site may not work
                properly without them.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Third-Party Services
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use a handful of trusted third-party services to run our
                business:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Stripe</strong> &mdash; handles payment processing.
                  Your payment data goes directly to Stripe and is protected by
                  their security standards. See{' '}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    Stripe&apos;s privacy policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Shipping carriers</strong> &mdash; we share your
                  shipping address with carriers to deliver your order.
                </li>
                <li>
                  <strong>Analytics</strong> &mdash; we may use analytics tools
                  to understand site traffic and improve the user experience.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Data Retention
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We keep your order records and contact information for as long as
                needed to fulfill our business obligations, handle any
                warranties or disputes, and comply with legal requirements.
                Contact form submissions and quote requests are kept for a
                reasonable period so we can follow up and provide good service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Your Rights
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Access</strong> your personal data &mdash; ask us what
                  information we have about you.
                </li>
                <li>
                  <strong>Correct</strong> inaccurate information &mdash; let us
                  know if something&apos;s wrong and we&apos;ll fix it.
                </li>
                <li>
                  <strong>Delete</strong> your data &mdash; request that we
                  remove your personal information, subject to legal retention
                  requirements.
                </li>
                <li>
                  <strong>Opt out</strong> of marketing communications at any
                  time.
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                To exercise any of these rights, just reach out to us at the
                contact information below. We&apos;ll respond as quickly as we
                can.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We take reasonable steps to protect your information from
                unauthorized access, loss, or misuse. Our site uses SSL
                encryption, and payment processing is handled by
                PCI-compliant providers. That said, no method of transmission
                over the internet is 100% secure, and we can&apos;t guarantee
                absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Changes to This Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If we make significant changes to this privacy policy,
                we&apos;ll update this page and note the new effective date at
                the top. We encourage you to check back occasionally.
              </p>
            </div>

            <div className="bg-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Questions?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this privacy policy or how we
                handle your data, contact us through our website at{' '}
                <a
                  href="/contact"
                  className="text-amber-600 hover:text-amber-700 underline"
                >
                  customtintackers.com/contact
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
              <p className="text-gray-600 mt-2">
                {siteConfig.company}
                <br />
                {siteConfig.address.street}
                <br />
                {siteConfig.address.city}, {siteConfig.address.state}{' '}
                {siteConfig.address.zip}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
