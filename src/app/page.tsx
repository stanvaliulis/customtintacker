import { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import ValueProps from '@/components/home/ValueProps';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BrandShowcase from '@/components/home/BrandShowcase';
import DistributorBanner from '@/components/home/DistributorBanner';
import CTABanner from '@/components/home/CTABanner';

export const metadata: Metadata = {
  title: 'Custom Tin Tackers | Embossed Aluminum Tin Tacker Signs for Breweries, Bars & Brands',
  description:
    'Order custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics, Machesney Park, IL. Premium tin tackers for breweries, bars, restaurants, cannabis brands, and promotional campaigns. Square, circle, can shape, bottle cap, arrow, and custom die-cut tin tackers. Factory-direct bulk pricing from $3.50/unit with free proofs and fast shipping.',
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
    title: 'Custom Tin Tackers | Embossed Aluminum Tin Tacker Signs for Breweries, Bars & Brands',
    description:
      'Order custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics. Factory-direct bulk pricing for breweries, bars, restaurants, and brands. Square, circle, can shape, bottle cap, and custom die-cut tin tackers.',
    url: 'https://customtintackers.com',
  },
  alternates: {
    canonical: 'https://customtintackers.com',
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />
      <FeaturedProducts />
      <BrandShowcase />
      <DistributorBanner />
      <CTABanner />
    </>
  );
}
