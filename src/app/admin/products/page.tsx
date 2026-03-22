'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Check, X, Package, Search } from 'lucide-react';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  displaySize?: string;
  dimensions?: { width: number; height: number; displaySize: string };
  featured: boolean;
  inStock: boolean;
  sortOrder: number;
  pricingTiers: { minQuantity: number; pricePerUnit: number }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getPriceRange(tiers: { minQuantity: number; pricePerUnit: number }[]) {
    if (!tiers.length) return '\u2014';
    const prices = tiers.map((t) => t.pricePerUnit);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `${formatPrice(min)} \u2013 ${formatPrice(max)}`;
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your tin tacker sign catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading products...</span>
          </div>
        </div>
      ) : filtered.length === 0 && products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No products yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Run the seed script or add your first product.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500">
            No products match &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Size
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Category
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Price Range
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Featured
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  In Stock
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{product.slug}</div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{product.displaySize || product.dimensions?.displaySize || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600 font-mono text-xs">
                    {getPriceRange(product.pricingTiers)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {product.featured ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
                        <X className="w-3.5 h-3.5 text-gray-300" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {product.inStock ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      )}
    </div>
  );
}
