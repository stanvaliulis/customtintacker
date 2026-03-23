import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import ArtworkTemplatesContent from '@/components/artwork-templates/ArtworkTemplatesContent';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import Link from 'next/link';
import {
  ChevronRight,
  Download,
  Palette,
  Send,
  FileImage,
  Ruler,
  Droplets,
  Eye,
  Monitor,
  Type,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Artwork Templates | Download Tin Tacker Design Templates',
  description:
    'Download free print-ready artwork templates for custom tin tacker signs. Every shape and size with bleed and safe areas marked. AI, PDF, and SVG templates for designers. Made for breweries, bars, and brand promotions.',
  keywords: [
    'tin tacker artwork template',
    'tin tacker design template',
    'custom sign template',
    'embossed aluminum sign template',
    'print ready template',
    'tin tacker bleed area',
    'tin tacker safe area',
    'artwork guidelines tin tacker',
  ],
  openGraph: {
    title: 'Artwork Templates | Download Tin Tacker Design Templates',
    description:
      'Download free print-ready artwork templates for every tin tacker shape and size. Bleed and safe areas marked for your designer.',
    url: 'https://customtintackers.com/artwork-templates',
  },
  alternates: {
    canonical: 'https://customtintackers.com/artwork-templates',
  },
};

const steps = [
  {
    icon: Download,
    title: 'Download Template',
    description: 'Pick your shape and size, then download the SVG template with bleed and safe areas marked.',
  },
  {
    icon: Palette,
    title: 'Place Your Artwork',
    description: 'Open the template in Illustrator, Photoshop, or any design tool. Place your artwork within the safe area.',
  },
  {
    icon: Send,
    title: 'Send It Back to Us',
    description: 'Upload your finished artwork through our design tool or contact form. We handle the rest.',
  },
];

const specs = [
  {
    icon: FileImage,
    label: 'File Formats',
    value: 'AI, PSD, PDF, PNG (300dpi), SVG',
  },
  {
    icon: Droplets,
    label: 'Color Mode',
    value: 'CMYK preferred, RGB accepted',
  },
  {
    icon: Ruler,
    label: 'Bleed',
    value: '0.125" on all sides',
  },
  {
    icon: Eye,
    label: 'Safe Area',
    value: '0.25" from trim edge',
  },
  {
    icon: Monitor,
    label: 'Resolution',
    value: '300 DPI minimum',
  },
  {
    icon: Type,
    label: 'Fonts',
    value: 'Convert to outlines / paths',
  },
];

export default function ArtworkTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Artwork Templates', url: `${siteConfig.url}/artwork-templates` },
        ])}
      />

      {/* Breadcrumbs */}
      <div className="border-b border-gray-800/50 bg-gray-950">
        <Container>
          <nav className="py-4 flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-amber-400 font-medium">Artwork Templates</span>
          </nav>
        </Container>
      </div>

      {/* Hero */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
              Artwork Templates
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
              Download ready-to-use templates for your designer. Every shape, every size,
              with bleed and safe areas marked.
            </p>
          </div>
        </Container>
      </section>

      {/* How to Use */}
      <section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 text-center"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 text-gray-950 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 mt-2">
                  <step.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Templates Grid (client component) */}
      <section className="pb-16">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Download Templates</h2>
            <p className="text-gray-400">
              Select your sign shape and size to download a print-ready SVG template.
            </p>
          </div>
          <ArtworkTemplatesContent />
        </Container>
      </section>

      {/* Artwork Specs */}
      <section className="pb-16">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Artwork Specifications
              </h2>
              <p className="text-gray-400">
                Follow these requirements to ensure your artwork prints perfectly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <spec.icon className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-white text-sm">{spec.label}</h3>
                  </div>
                  <p className="text-gray-300 text-sm">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Need Help CTA */}
      <section className="pb-20">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-500/20 p-8 sm:p-10 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Not sure about your artwork?
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Send it to us and we&apos;ll check it for free. Our team will review your
                files and let you know if anything needs adjustment before we go to print.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Us Your Artwork
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
