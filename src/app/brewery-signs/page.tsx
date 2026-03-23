import { Metadata } from 'next';
import { getIndustryBySlug } from '@/data/industries';
import IndustryPage from '@/components/industries/IndustryPage';

const industry = getIndustryBySlug('brewery-signs')!;

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

export default function BrewerySignsPage() {
  return <IndustryPage industry={industry} />;
}
