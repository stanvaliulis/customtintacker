import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import ContactForm from '@/components/forms/ContactForm';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { Phone, MapPin, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — Order Custom Tin Tackers | Interstate Graphics',
  description:
    'Contact Interstate Graphics to order custom tin tacker signs, request quotes, get artwork help, or ask product questions. Located in Machesney Park, IL. We respond within 1 business day. Call (815) 877-8300, email, or fill out our contact form for custom embossed aluminum tin tackers.',
  keywords: [
    'contact tin tacker company',
    'order tin tackers',
    'buy tin tackers',
    'tin tacker support',
    'Interstate Graphics contact',
    'Interstate Graphics phone number',
    'custom tin tacker order help',
    'embossed sign inquiry',
    'tin tacker customer service',
  ],
  openGraph: {
    title: 'Contact Us — Order Custom Tin Tackers | Interstate Graphics',
    description:
      'Get in touch with Interstate Graphics for custom tin tacker sign orders, quotes, and support. We respond within 1 business day.',
    url: 'https://customtintackers.com/contact',
  },
  alternates: {
    canonical: 'https://customtintackers.com/contact',
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Contact', url: `${siteConfig.url}/contact` },
        ])}
      />
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600">
              Have questions about our products or need help with a custom order? We&apos;re here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <ContactForm />
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Message Us</p>
                      <p className="text-sm text-gray-600">Use the form on this page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{siteConfig.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{siteConfig.address.city}, {siteConfig.address.state}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="font-semibold text-amber-900 mb-2">Response Time</h3>
                <p className="text-sm text-amber-800">
                  We typically respond within 1 business day. For urgent orders, please call us directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
    </>
  );
}
