import { Metadata } from 'next';
import { getIndustryBySlug } from '@/data/industries';
import IndustryPage from '@/components/industries/IndustryPage';

const industry = getIndustryBySlug('coffee-signs')!;

export const metadata: Metadata = {
  title: industry.metaTitle,
  description: industry.metaDescription,
  keywords: industry.keywords,
  openGraph: {
    title: industry.metaTitle,
    description: industry.metaDescription,
    url: `https://customtintackers.com/${industry.slug}`,
  },
  alternates: {
    canonical: `https://customtintackers.com/${industry.slug}`,
  },
};

export default function CoffeeSignsPage() {
  return <IndustryPage industry={industry} />;
}
