import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply as a Tin Tacker Distributor | Wholesale Embossed Aluminum Signs',
  description:
    'Apply to become an authorized tin tacker distributor with Custom Tin Tackers by Interstate Graphics. ASI, SAGE, and PPAI members get exclusive wholesale pricing up to 30% off on embossed aluminum tin tacker signs. Blind dropship, marketing support, and low minimums included.',
  keywords: [
    'tin tacker distributor application',
    'become tin tacker distributor',
    'tin tacker distributor sign up',
    'ASI distributor sign up',
    'SAGE distributor',
    'PPAI distributor',
    'wholesale tin tackers apply',
    'promotional products distributor',
  ],
  openGraph: {
    title: 'Apply as a Tin Tacker Distributor | Wholesale Embossed Aluminum Signs',
    description:
      'Apply for our tin tacker distributor program. Exclusive wholesale pricing up to 30% off for ASI, SAGE, and PPAI promotional products members.',
    url: 'https://customtintackers.com/distributors/apply',
  },
  alternates: {
    canonical: 'https://customtintackers.com/distributors/apply',
  },
};

export default function DistributorApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
