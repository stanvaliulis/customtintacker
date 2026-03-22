import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wholesale Login',
  description: 'Sign in to access wholesale pricing for custom tin tacker signs.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WholesaleLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
