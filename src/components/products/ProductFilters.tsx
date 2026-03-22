'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { shapeFilters, categoryFilters } from '@/data/categories';
import { SlidersHorizontal, X } from 'lucide-react';

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentShape = searchParams.get('shape') || '';
  const currentCategory = searchParams.get('category') || '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  }

  function clearAll() {
    router.push('/products');
  }

  const hasFilters = currentShape || currentCategory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Category filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => updateFilter('category', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !currentCategory
                ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
            }`}
          >
            All Categories
          </button>
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter('category', f.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                currentCategory === f.value
                  ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shape filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shape</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => updateFilter('shape', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              !currentShape
                ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
            }`}
          >
            All Shapes
          </button>
          {shapeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => updateFilter('shape', f.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                currentShape === f.value
                  ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
