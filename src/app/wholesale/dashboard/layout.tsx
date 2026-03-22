import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wholesale Dashboard',
  description: 'Access your wholesale pricing and place orders for custom tin tacker signs.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WholesaleDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
