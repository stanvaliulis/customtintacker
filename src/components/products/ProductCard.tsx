import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice, getLowestPrice } from '@/lib/utils';
import ProductImagePlaceholder from './ProductImagePlaceholder';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = getLowestPrice(product.pricingTiers);
  const maxQtyTier = product.pricingTiers.find((t) => t.maxQuantity === null);
  const firstTierPrice = product.pricingTiers[0]?.pricePerUnit ?? lowestPrice;
  const savingsPercent = Math.round(((firstTierPrice - lowestPrice) / firstTierPrice) * 100);

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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50">
              <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-xs text-gray-500 font-medium">Image Coming Soon</span>
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
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                    From {formatPrice(lowestPrice)}
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    /unit at {maxQtyTier?.minQuantity?.toLocaleString()}+
                  </span>
                </div>
                {savingsPercent > 0 && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                    Save {savingsPercent}%
                  </span>
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
