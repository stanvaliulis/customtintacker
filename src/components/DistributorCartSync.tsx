'use client';

import { useEffect } from 'react';
import { useDistributor } from '@/context/DistributorContext';
import { useCart } from '@/context/CartContext';

/**
 * Syncs distributor status from DistributorContext into CartContext
 * so that cart prices update when a distributor logs in/out.
 */
export function DistributorCartSync() {
  const { isDistributor, distributorDiscount } = useDistributor();
  const { setDistributor } = useCart();

  useEffect(() => {
    setDistributor(isDistributor, distributorDiscount);
  }, [isDistributor, distributorDiscount, setDistributor]);

  return null;
}
