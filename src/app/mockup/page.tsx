import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import MockupGeneratorLoader from '@/components/mockup/MockupGeneratorLoader';

export const metadata: Metadata = {
  title: 'Instant Tin Tacker Mockup Generator | Preview Your Custom Sign',
  description:
    'Upload your logo and instantly preview it on a realistic tin tacker sign mockup. Choose from 8+ shapes, pick your colors, and download a high-quality preview in seconds. Free tool by Custom Tin Tackers.',
  keywords: [
    'tin tacker mockup',
    'preview custom sign',
    'tin tacker preview tool',
    'sign mockup generator',
    'custom sign preview',
    'tin tacker design preview',
    'aluminum sign mockup',
    'bar sign preview',
    'brewery sign mockup',
  ],
  openGraph: {
    title: 'Instant Tin Tacker Mockup Generator | Preview Your Custom Sign',
    description:
      'Upload your logo and preview it on any tin tacker shape. Takes 10 seconds. Free mockup tool.',
    url: 'https://customtintackers.com/mockup',
  },
  alternates: {
    canonical: 'https://customtintackers.com/mockup',
  },
};

export default function MockupPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />

        <Container className="relative py-14 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Free Mockup Tool
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              See Your Sign{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Before You Order
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Upload your logo and preview it on any tin tacker shape.
              Takes 10 seconds.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Generator ──────────────────────────────────────────────── */}
      <section className="py-10 sm:py-16">
        <Container>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Loading mockup generator...</p>
                </div>
              </div>
            }
          >
            <MockupGeneratorLoader />
          </Suspense>
        </Container>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 border-t border-gray-800/50 py-14">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Make It Real?
            </h2>
            <p className="text-gray-400 mb-8">
              Our custom tin tacker signs are made from premium embossed recycled
              aluminum, printed in full color, and built to last. Minimum order
              of 50 units with factory-direct pricing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
              >
                Request a Quote
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg border border-gray-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
