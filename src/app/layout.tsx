import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { getOrganizationSchema, getWebSiteSchema, getLocalBusinessSchema } from '@/lib/structured-data';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://customtintackers.com'),
  title: {
    default: 'Custom Tin Tackers | Embossed Aluminum Tin Tacker Signs | Bar & Brewery Signs Made in USA',
    template: '%s | Custom Tin Tackers',
  },
  description:
    'Custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics, Machesney Park, IL. Premium tin tackers for breweries, bars, restaurants, cannabis brands, and promotional campaigns. Factory-direct bulk pricing from $3.50/unit. Square, circle, bottle cap, can shape, arrow, license plate, and custom die-cut tin tackers available. Recycled aluminum, full-color printing, and fast nationwide shipping.',
  keywords: [
    'tin tackers',
    'tin tacker',
    'tin tacker signs',
    'custom tin tackers',
    'custom tin tacker',
    'custom tin tacker signs',
    'embossed aluminum signs',
    'embossed metal signs',
    'embossed tin signs',
    'bar signs',
    'brewery signs',
    'beer signs',
    'custom bar signs',
    'custom brewery signs',
    'metal bar signs',
    'aluminum signs',
    'restaurant signs',
    'promotional signs',
    'made in USA signs',
    'bulk tin tackers',
    'wholesale tin tackers',
    'custom aluminum signs',
    'bottle cap signs',
    'bottle cap tin tacker',
    'can shape signs',
    'can shape tin tacker',
    'die cut signs',
    'custom die cut tin tacker',
    'street sign tacker',
    'arrow tin tacker',
    'license plate tin tacker',
    'embossed sign manufacturer',
    'tin tacker manufacturer',
    'tin tacker supplier',
    'tin tacker company',
    'tin tacker pricing',
    'tin tacker bulk pricing',
    'Interstate Graphics',
    'Machesney Park IL',
    'recycled aluminum signs',
    'promotional products signs',
    'brewery promotional signs',
    'bar wall signs',
    'craft beer signs',
    'beverage signs',
    'cannabis signs',
    'taproom signs',
    'tin tacker printing',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Custom Tin Tackers | Embossed Aluminum Tin Tacker Signs Made in USA',
    description:
      'Premium custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics. Factory-direct bulk pricing for breweries, bars, restaurants, and brands. Square, circle, bottle cap, can shape, and custom die-cut tin tackers.',
    url: 'https://customtintackers.com',
    siteName: 'Custom Tin Tackers',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Custom Tin Tackers — Embossed Aluminum Signs Made in USA by Interstate Graphics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Tin Tackers | Embossed Aluminum Tin Tacker Signs Made in USA',
    description:
      'Premium custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics. Factory-direct bulk pricing for breweries, bars, and brands.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://customtintackers.com',
  },
  category: 'Signs & Displays',
  other: {
    'format-detection': 'telephone=no',
    'geo.region': 'US-IL',
    'geo.placename': 'Machesney Park',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        <JsonLd data={getOrganizationSchema()} />
        <JsonLd data={getWebSiteSchema()} />
        <JsonLd data={getLocalBusinessSchema()} />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            Skip to main content
          </a>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
