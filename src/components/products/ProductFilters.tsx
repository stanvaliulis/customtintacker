'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { catalog } from '@/data/categories';
import { SlidersHorizontal, X } from 'lucide-react';

interface ProductFiltersProps {
  /** Product counts keyed "aluminum", "aluminum/circles", … plus "all". */
  counts: Record<string, number>;
}

export default function ProductFilters({ counts }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMaterial = searchParams.get('material') || '';
  const currentSub = searchParams.get('sub') || '';
  const hasFilters =
    currentMaterial || currentSub || searchParams.get('category') || searchParams.get('shape');

  function go(material: string, sub = '') {
    const params = new URLSearchParams();
    if (material) params.set('material', material);
    if (sub) params.set('sub', sub);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  }

  const item = (active: boolean) =>
    `flex w-full items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all ${
      active
        ? 'bg-amber-500/15 text-amber-400 font-medium border border-amber-500/20'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          Categories
        </h3>
        {hasFilters && (
          <button
            onClick={() => go('')}
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <button onClick={() => go('')} className={item(!hasFilters)}>
        <span>All Products</span>
        <span className="text-xs text-gray-500">{counts.all ?? 0}</span>
      </button>

      {catalog.map((group) => {
        const groupCount = counts[group.value] ?? 0;
        if (!groupCount) return null;
        return (
          <div key={group.value}>
            <button
              onClick={() => go(group.value)}
              className={`mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider transition-colors ${
                currentMaterial === group.value && !currentSub
                  ? 'text-amber-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{group.label}</span>
              <span className="font-normal text-gray-500">{groupCount}</span>
            </button>
            <div className="space-y-0.5">
              {group.subcategories.map((sub) => {
                const n = counts[`${group.value}/${sub.value}`] ?? 0;
                if (!n) return null;
                return (
                  <button
                    key={sub.value}
                    onClick={() => go(group.value, sub.value)}
                    className={item(currentMaterial === group.value && currentSub === sub.value)}
                  >
                    <span>{sub.label}</span>
                    <span className="text-xs text-gray-500">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
