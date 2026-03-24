'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, ProductShape } from '@/types/product';
import { formatPrice, getLowestPrice, getLowestCatalogPrice } from '@/lib/utils';
import { ArrowRight, Tag } from 'lucide-react';
import { useDistributor } from '@/context/DistributorContext';
import ProductImagePlaceholder from './ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isDistributor, distributorDiscount } = useDistributor();
  const lowestRetailPrice = getLowestPrice(product.pricingTiers);
  const maxQtyTier = product.pricingTiers.find((t) => t.maxQuantity === null);
  const firstTierPrice = product.pricingTiers[0]?.pricePerUnit ?? lowestRetailPrice;
  const savingsPercent = Math.round(((firstTierPrice - lowestRetailPrice) / firstTierPrice) * 100);

  // Distributor pricing
  const lowestCatalogPrice = getLowestCatalogPrice(product.pricingTiers);
  const distributorCost = Math.round(lowestCatalogPrice * (1 - distributorDiscount));
  const distributorSavingsVsRetail = lowestRetailPrice > 0
    ? Math.round(((lowestRetailPrice - distributorCost) / lowestRetailPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1">
        {/* Image area */}
        <div className="aspect-square relative overflow-hidden bg-gray-900">
          {product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-full h-[75%] px-6">
                <ProductImagePlaceholder
                  shape={product.shape as ProductShape}
                  productName={product.name}
                  label={product.dimensions.displaySize}
                />
              </div>
              <div className="mt-1 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-400 font-semibold tracking-wide uppercase">Image Coming Soon</span>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.featured && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-gray-950 backdrop-blur-sm">
                Popular
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-800/90 text-gray-300 backdrop-blur-sm border border-gray-700/50">
              {product.shape}
            </span>
            {isDistributor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 backdrop-blur-sm border border-amber-500/30">
                <Tag className="w-3 h-3" />
                Distributor Price
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400">
              View Details
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col border-t border-gray-800/50">
          <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors mb-1.5 text-base">
            {product.name}
          </h3>
          <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Price row */}
          <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-800/50">
            {product.pricingTiers.length > 0 ? (
              <>
                <div>
                  {isDistributor ? (
                    <>
                      <span className="text-sm text-gray-500 line-through block">
                        Retail: {formatPrice(lowestRetailPrice)}
                      </span>
                      <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                        From {formatPrice(distributorCost)}
                      </span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        /unit at {maxQtyTier?.minQuantity?.toLocaleString()}+
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                        From {formatPrice(lowestRetailPrice)}
                      </span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        /unit at {maxQtyTier?.minQuantity?.toLocaleString()}+
                      </span>
                    </>
                  )}
                </div>
                {isDistributor ? (
                  distributorSavingsVsRetail > 0 && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                      Save {distributorSavingsVsRetail}%
                    </span>
                  )
                ) : (
                  savingsPercent > 0 && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                      Save {savingsPercent}%
                    </span>
                  )
                )}
              </>
            ) : (
              <span className="text-base font-semibold text-amber-400">
                Contact for Quote
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
