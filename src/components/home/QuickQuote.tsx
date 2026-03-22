'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { products, backingOptions } from '@/data/products';
import { formatPrice, getPriceForQuantity } from '@/lib/utils';
import { Product, ProductShape } from '@/types/product';

/* ------------------------------------------------------------------ */
/*  Shapes available for quick selection                                */
/* ------------------------------------------------------------------ */

const QUICK_SHAPES: { id: ProductShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'circle', label: 'Circle' },
  { id: 'can', label: 'Can Shape' },
  { id: 'bottle-cap', label: 'Bottle Cap' },
];

const QUICK_QUANTITIES = [50, 100, 250, 500, 1000];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QuickQuote() {
  const [shape, setShape] = useState<ProductShape>('square');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0].id);
  const [quantity, setQuantity] = useState<number>(100);

  // Products for the selected shape
  const availableProducts = useMemo(
    () => products.filter((p) => p.shape === shape).sort((a, b) => a.sortOrder - b.sortOrder),
    [shape]
  );

  // Currently selected product (fall back to first available)
  const product: Product | undefined = useMemo(() => {
    const found = availableProducts.find((p) => p.id === selectedProductId);
    return found ?? availableProducts[0];
  }, [availableProducts, selectedProductId]);

  // Whenever shape changes, default to first product of that shape
  const handleShapeChange = (s: ProductShape) => {
    setShape(s);
    const prods = products.filter((p) => p.shape === s);
    if (prods.length > 0) {
      setSelectedProductId(prods[0].id);
      setQuantity(Math.max(prods[0].minimumOrder, quantity));
    }
  };

  // Price calculation (standard gauge)
  const unitPrice = useMemo(() => {
    if (!product) return null;
    return getPriceForQuantity(product.pricingTiers, quantity);
  }, [product, quantity]);

  const totalEstimate = unitPrice ? unitPrice * quantity + (product?.setupFee ?? 0) : null;

  return (
    <section className="bg-gray-900 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Instant Price Check</h3>
      </div>

      {/* Row of controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shape */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Shape
          </label>
          <select
            value={shape}
            onChange={(e) => handleShapeChange(e.target.value as ProductShape)}
            className="w-full bg-gray-800 text-white text-sm rounded-lg border border-gray-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {QUICK_SHAPES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Size
          </label>
          <select
            value={product?.id ?? ''}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm rounded-lg border border-gray-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.dimensions.displaySize}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Quantity
          </label>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full bg-gray-800 text-white text-sm rounded-lg border border-gray-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {QUICK_QUANTITIES.map((q) => (
              <option key={q} value={q}>
                {q.toLocaleString()} units
              </option>
            ))}
          </select>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-end">
          {unitPrice ? (
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-400 mb-0.5">Estimated from</p>
              <p className="text-2xl font-bold text-amber-400 leading-tight">
                {formatPrice(unitPrice)}
                <span className="text-sm text-gray-400 font-normal">/ea</span>
              </p>
              {totalEstimate && (
                <p className="text-xs text-gray-500 mt-0.5">
                  ~{formatPrice(totalEstimate)} total (incl. setup)
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select options to see pricing</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/quote/builder"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
        >
          Get Full Quote
          <ArrowRight className="w-4 h-4" />
        </Link>
        <span className="text-xs text-gray-500">
          Standard .024&quot; gauge shown. Customize gauge, artwork &amp; more in the full builder.
        </span>
      </div>
    </section>
  );
}
