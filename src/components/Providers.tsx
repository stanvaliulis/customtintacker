'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { DistributorProvider } from '@/context/DistributorContext';
import { DistributorCartSync } from '@/components/DistributorCartSync';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchInterval={0} refetchOnWindowFocus={false}>
      <DistributorProvider>
        <CartProvider>
          <DistributorCartSync />
          {children}
          <Toaster position="bottom-right" />
        </CartProvider>
      </DistributorProvider>
    </SessionProvider>
  );
}
