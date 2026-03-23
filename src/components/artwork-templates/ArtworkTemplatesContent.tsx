'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { products } from '@/data/products';
import { Product, ProductShape } from '@/types/product';
import { Download } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Shape metadata with SVG icons (matching QuoteBuilder)              */
/* ------------------------------------------------------------------ */

interface ShapeGroup {
  id: ProductShape;
  label: string;
  icon: React.ReactNode;
}

const SHAPE_GROUPS: ShapeGroup[] = [
  {
    id: 'rectangle',
    label: 'Rectangle',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="6" y="12" width="52" height="40" rx="3" />
      </svg>
    ),
  },
  {
    id: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="8" y="8" width="48" height="48" rx="3" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="32" cy="32" r="26" />
      </svg>
    ),
  },
  {
    id: 'can',
    label: 'Can Shape',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8 C18 8 22 4 32 4 C42 4 46 8 46 8 L46 56 C46 56 42 60 32 60 C22 60 18 56 18 56 Z" />
        <ellipse cx="32" cy="8" rx="14" ry="4" />
      </svg>
    ),
  },
  {
    id: 'bottle-cap',
    label: 'Bottle Cap',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 4 L36 10 L44 8 L42 16 L50 18 L46 24 L52 30 L46 34 L50 40 L42 42 L44 50 L36 48 L32 54 L28 48 L20 50 L22 42 L14 40 L18 34 L12 30 L18 24 L14 18 L22 16 L20 8 L28 10 Z" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M8 32 L28 12 L28 22 L56 22 L56 42 L28 42 L28 52 Z" />
      </svg>
    ),
  },
  {
    id: 'shield',
    label: 'Shield',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 4 L54 14 L54 34 Q54 50 32 60 Q10 50 10 34 L10 14 Z" />
      </svg>
    ),
  },
  {
    id: 'street-sign',
    label: 'Street Sign',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="18" width="56" height="28" rx="3" />
      </svg>
    ),
  },
  {
    id: 'license-plate',
    label: 'License Plate',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="16" width="56" height="32" rx="4" />
        <circle cx="12" cy="24" r="2" fill="currentColor" />
        <circle cx="52" cy="24" r="2" fill="currentColor" />
        <circle cx="12" cy="40" r="2" fill="currentColor" />
        <circle cx="52" cy="40" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'die-cut',
    label: 'Custom Die-Cut',
    icon: (
      <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10 20 Q10 10 20 10 L44 10 Q54 10 54 20 L54 35 Q54 42 48 46 L34 56 Q32 58 30 56 L16 46 Q10 42 10 35 Z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Group products by shape                                            */
/* ------------------------------------------------------------------ */

function groupProductsByShape(products: Product[]): Map<ProductShape, Product[]> {
  const grouped = new Map<ProductShape, Product[]>();
  for (const p of products) {
    const existing = grouped.get(p.shape) ?? [];
    existing.push(p);
    grouped.set(p.shape, existing);
  }
  // Sort each group by sortOrder
  for (const [, items] of grouped) {
    items.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return grouped;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ArtworkTemplatesContent() {
  const grouped = useMemo(() => groupProductsByShape(products), []);

  function handleDownload(product: Product) {
    toast.success('Template downloading...', { duration: 2000 });
    // Trigger download via the API route
    window.open(`/api/templates/${product.id}`, '_blank');
  }

  return (
    <div className="space-y-10">
      {SHAPE_GROUPS.map((shape) => {
        const shapeProducts = grouped.get(shape.id);
        if (!shapeProducts || shapeProducts.length === 0) return null;

        return (
          <div key={shape.id}>
            {/* Shape heading */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700/50 flex items-center justify-center text-amber-400">
                {shape.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{shape.label}</h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                {shapeProducts.length} {shapeProducts.length === 1 ? 'size' : 'sizes'}
              </span>
            </div>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shapeProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {product.dimensions.displaySize}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.name}</p>
                    </div>
                    <div className="text-amber-400/60 shrink-0">{shape.icon}</div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>
                      Trim: {product.dimensions.width}&quot; x {product.dimensions.height}&quot;
                    </p>
                    <p>Bleed: 0.125&quot; all sides</p>
                    <p>Safe area: 0.25&quot; inside trim</p>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleDownload(product)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      SVG
                    </button>
                    <button
                      onClick={() => {
                        toast.success('Template downloading...', { duration: 2000 });
                        window.open(`/api/templates/${product.id}`, '_blank');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => {
                        toast.success('Template downloading...', { duration: 2000 });
                        window.open(`/api/templates/${product.id}`, '_blank');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-gray-700/50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
