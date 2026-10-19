'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { publicTiers, lowestTier } from '@/lib/catalog-pricing';
import { formatPrice } from '@/lib/utils';

export default function ProductPicker({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [shape, setShape] = useState('all');
  const [material, setMaterial] = useState('all');
  const matching = products.filter(p => (shape === 'all' || p.shape === shape) && (material === 'all' || p.metadata.material === material) && `${p.name} ${p.sku} ${p.dimensions.displaySize}`.toLowerCase().includes(query.toLowerCase()));
  const input = 'block mt-2 min-h-11 w-full rounded-lg border border-gray-600 bg-gray-900 text-white px-3 text-sm';
  return <section aria-label="Choose a product" className="py-8">
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      <label className="text-gray-200 text-sm">Search products<input type="search" className={input} value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, size or SKU" /></label>
      <label className="text-gray-200 text-sm">Shape<select className={input} value={shape} onChange={e => setShape(e.target.value)}><option value="all">All shapes</option>{[...new Set(products.map(p => p.shape))].map(s => <option key={s} value={s}>{s.replaceAll('-', ' ')}</option>)}</select></label>
      <label className="text-gray-200 text-sm">Material<select className={input} value={material} onChange={e => setMaterial(e.target.value)}><option value="all">All materials</option>{[...new Set(products.map(p => p.metadata.material))].map(m => <option key={m}>{m}</option>)}</select></label>
    </div>
    <p role="status" className="text-sm text-gray-300 mb-5">{matching.length} products · Prices shown per unit at the stated quantity. Check product details for options.</p>
    {!matching.length && <div className="p-6 rounded-xl border border-gray-700 text-white">No products match. <button className="underline text-amber-300 min-h-11" onClick={() => { setQuery(''); setShape('all'); setMaterial('all'); }}>Clear filters</button></div>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{matching.map(product => {
      const tier = lowestTier(publicTiers(product.pricingTiers));
      return <article key={product.id} className="flex flex-col rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="text-xs uppercase tracking-wider text-amber-300 mb-2">{product.metadata.material}</p>
        <h2 className="text-white text-lg font-semibold">{product.name}</h2>
        <p className="text-sm text-gray-300 mt-2">{product.dimensions.displaySize} · {product.minimumOrder} unit minimum</p>
        <p className="text-sm text-gray-300 mt-2">{tier ? `From ${formatPrice(tier.pricePerUnit)}/ea at ${tier.minQuantity.toLocaleString()} units` : 'Request a custom quote'}</p>
        {product.shape === 'die-cut' && <p className="text-xs text-gray-400 mt-2">Editor uses a layout placeholder. Final cut shape needs a production proof.</p>}
        <div className="mt-auto pt-5 flex gap-4 items-center">
          <Link className="min-h-11 rounded-lg bg-amber-700 hover:bg-amber-600 text-white px-4 flex items-center text-sm font-semibold" href={`/design/${product.id}`}>Start designing</Link>
          <Link className="text-sm text-gray-300 underline min-h-11 flex items-center" href={`/products/${product.slug}`}>Product details</Link>
        </div>
      </article>;
    })}</div>
  </section>;
}
