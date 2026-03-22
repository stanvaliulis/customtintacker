import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Distributor Account',
  description: 'Manage your distributor account, view order history, and access distributor tools.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
