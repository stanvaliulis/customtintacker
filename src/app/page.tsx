import { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import SignAnswers from '@/components/home/SignAnswers';
import ValueProps from '@/components/home/ValueProps';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BrandShowcase from '@/components/home/BrandShowcase';
import StateTackersShowcase from '@/components/home/StateTackersShowcase';
import DistributorBanner from '@/components/home/DistributorBanner';
import CTABanner from '@/components/home/CTABanner';

export const metadata: Metadata = {
  title: 'Custom Embossed Metal Signs | Custom Tin Tackers',
  description: 'Custom embossed metal signs for breweries, bars and brands. Explore tin tacker shapes, quantity pricing and artwork options from Interstate Graphics.',
  keywords: [
    'tin tackers',
    'custom tin tackers',
    'tin tacker signs',
    'embossed aluminum signs',
    'bar signs',
    'brewery signs',
    'beer signs',
    'custom bar signs',
    'bottle cap tin tacker',
    'can shape tin tacker',
    'made in USA signs',
    'promotional tin tackers',
    'Interstate Graphics',
  ],
  openGraph: {
    title: 'Custom Embossed Metal Signs | Custom Tin Tackers',
    description: 'Custom embossed metal signs for breweries, bars and brands. Explore tin tacker shapes, quantity pricing and artwork options from Interstate Graphics.',
    url: 'https://www.customtintackers.com',
  },
  alternates: {
    canonical: 'https://www.customtintackers.com',
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SignAnswers />
      <ValueProps />
      <FeaturedProducts />
      <BrandShowcase />
      <StateTackersShowcase />
      <DistributorBanner />
      <CTABanner />
    </>
  );
}
