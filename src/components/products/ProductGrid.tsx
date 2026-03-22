import { Product } from '@/types/product';
import ProductCard from './ProductCard';
import { PackageX } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
          <PackageX className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-300 text-lg font-medium">No products match your filters</p>
        <p className="text-gray-500 text-sm mt-2">Try removing some filters to see more products.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
