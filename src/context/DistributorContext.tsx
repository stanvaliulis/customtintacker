'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface DistributorInfo {
  companyName: string;
  asiNumber: string;
  sageNumber: string;
  ppaiNumber: string;
  contactName: string;
  email: string;
}

interface DistributorContextType {
  isDistributor: boolean;
  distributorInfo: DistributorInfo | null;
  /** Discount percentage as a decimal, e.g. 0.40 for 40% off */
  distributorDiscount: number;
}

const DistributorContext = createContext<DistributorContextType>({
  isDistributor: false,
  distributorInfo: null,
  distributorDiscount: 0,
});

export function DistributorProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const value = useMemo<DistributorContextType>(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const role = user?.role as string | undefined;
    const isDistributor = role === 'distributor' || role === 'wholesale';

    if (!isDistributor || !user) {
      return {
        isDistributor: false,
        distributorInfo: null,
        distributorDiscount: 0,
      };
    }

    return {
      isDistributor: true,
      distributorInfo: {
        companyName: (user.companyName as string) || (user.name as string) || 'Distributor',
        asiNumber: (user.asiNumber as string) || '',
        sageNumber: (user.sageNumber as string) || '',
        ppaiNumber: (user.ppaiNumber as string) || '',
        contactName: (user.name as string) || '',
        email: (user.email as string) || '',
      },
      distributorDiscount: (user.discountTier as number) ?? 0.40,
    };
  }, [session]);

  return (
    <DistributorContext.Provider value={value}>
      {children}
    </DistributorContext.Provider>
  );
}

export function useDistributor() {
  return useContext(DistributorContext);
}
