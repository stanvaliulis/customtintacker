'use client';

import { useEffect, useRef } from 'react';
import { useDistributor } from '@/context/DistributorContext';
import { useCart } from '@/context/CartContext';

/**
 * Syncs distributor status from DistributorContext into CartContext
 * so that cart prices update when a distributor logs in/out.
 */
export function DistributorCartSync() {
  const { isDistributor, distributorDiscount } = useDistributor();
  const { setDistributor } = useCart();
  const prevRef = useRef({ isDistributor: false, discount: 0 });

  useEffect(() => {
    // Only dispatch when values actually change to avoid infinite loops
    if (
      prevRef.current.isDistributor !== isDistributor ||
      prevRef.current.discount !== distributorDiscount
    ) {
      prevRef.current = { isDistributor, discount: distributorDiscount };
      setDistributor(isDistributor, distributorDiscount);
    }
  }, [isDistributor, distributorDiscount]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
