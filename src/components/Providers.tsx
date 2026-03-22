'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchInterval={0} refetchOnWindowFocus={false}>
      <CartProvider>
        {children}
        <Toaster position="bottom-right" />
      </CartProvider>
    </SessionProvider>
  );
}
