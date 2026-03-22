'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy redirect: /wholesale/dashboard now redirects to /account.
 * Distributors shop the normal site with discounted pricing.
 */
export default function WholesaleDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
