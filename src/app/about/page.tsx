import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { Factory, Award, Recycle, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Tin Tacker Manufacturer | Interstate Graphics, Machesney Park IL',
  description:
    'Interstate Graphics is a leading American tin tacker manufacturer based in Machesney Park, Illinois. We produce custom embossed aluminum tin tacker signs for breweries, bars, restaurants, and brands nationwide. Decades of expertise, recycled aluminum materials, factory-direct pricing, and premium craftsmanship on every tin tacker we make.',
  keywords: [
    'Interstate Graphics',
    'tin tacker manufacturer',
    'tin tacker company',
    'tin tacker supplier',
    'embossed aluminum sign manufacturer',
    'Machesney Park IL',
    'made in USA tin tackers',
    'American sign manufacturer',
    'recycled aluminum signs',
    'custom tin tacker company',
    'who makes tin tackers',
  ],
  openGraph: {
    title: 'About Us — Tin Tacker Manufacturer | Interstate Graphics, Machesney Park IL',
    description:
      'Interstate Graphics is a leading US manufacturer of custom embossed aluminum tin tacker signs. Located in Machesney Park, IL, serving breweries, bars, and brands nationwide with premium tin tackers.',
    url: 'https://customtintackers.com/about',
  },
  alternates: {
    canonical: 'https://customtintackers.com/about',
  },
};

const highlights = [
  {
    icon: Factory,
    title: 'USA Manufacturing',
    description: 'Every tin tacker we produce is manufactured right here in the United States, ensuring quality control and fast turnaround times.',
  },
  {
    icon: Award,
    title: 'Industry Expertise',
    description: 'With decades of experience in sign manufacturing, we understand what makes a great tin tacker — from material selection to print quality.',
  },
  {
    icon: Recycle,
    title: 'Recycled Materials',
    description: 'Our embossed aluminum signs are made from recycled materials, reducing environmental impact without compromising quality.',
  },
  {
    icon: Users,
    title: 'Trusted by Brands',
    description: 'From craft breweries to national brands, thousands of companies trust Interstate Graphics for their tin tacker needs.',
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'About', url: `${siteConfig.url}/about` },
        ])}
      />
    <section className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">About Interstate Graphics</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Interstate Graphics is a leading manufacturer of custom embossed aluminum tin tacker signs. We produce thousands of signs each year for breweries, beverage companies, restaurants, and brands across the country. Our commitment to quality, competitive pricing, and American manufacturing sets us apart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
          {highlights.map((h) => (
            <div key={h.title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
                <h.icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{h.title}</h3>
              <p className="text-gray-600 text-sm">{h.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-8">
            {[
              { step: '1', title: 'Design', desc: 'Submit your artwork or work with our design team' },
              { step: '2', title: 'Proof', desc: 'Review and approve your digital proof' },
              { step: '3', title: 'Produce', desc: 'We manufacture your signs in our USA facility' },
              { step: '4', title: 'Ship', desc: 'Individually wrapped signs delivered to your door' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold text-sm">{s.step}</span>
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
    </>
  );
}
