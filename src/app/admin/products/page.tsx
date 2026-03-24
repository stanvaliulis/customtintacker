'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Check, X, Package, Search, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
  catalogPrice?: number;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  shape: string;
  displaySize?: string;
  dimensions?: { width: number; height: number; displaySize: string };
  featured: boolean;
  inStock: boolean;
  sortOrder: number;
  pricingTiers: PricingTier[];
  shortDescription?: string;
  longDescription?: string;
  minimumOrder?: number;
  leadTimeDays?: number;
  setupFee?: number;
  wholesaleDiscount?: number;
  features?: string[] | { text: string; sortOrder: number }[];
  backingOptions?: string[] | { backingId: string }[];
  images?: string[] | { url: string; alt: string; sortOrder: number }[];
  metadata?: { material: string; printMethod: string; mountingHoles: number; shrinkWrapped: boolean; madeInUSA: boolean };
}

interface EditingProduct {
  id: string;
  name: string;
  shortDescription: string;
  shape: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  pricingTiers: PricingTier[];
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditingProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast(`"${name}" deleted`);
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch {
      showToast('Failed to delete product', 'error');
    }
  }

  function startEdit(product: ProductRow) {
    setEditingId(product.id);
    setEditData({
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription || '',
      shape: product.shape || '',
      category: product.category,
      inStock: product.inStock,
      featured: product.featured,
      pricingTiers: product.pricingTiers || [],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData(null);
  }

  async function saveEdit() {
    if (!editData) return;
    setSaving(true);
    try {
      // First get the full product data
      const fullRes = await fetch(`/api/admin/products/${editData.id}`);
      if (!fullRes.ok) throw new Error('Failed to fetch product');
      const fullProduct = await fullRes.json();

      // Merge edits into the full product
      const body = {
        ...fullProduct,
        name: editData.name,
        shortDescription: editData.shortDescription,
        shape: editData.shape,
        category: editData.category,
        inStock: editData.inStock,
        featured: editData.featured,
        pricingTiers: editData.pricingTiers,
      };

      const res = await fetch(`/api/admin/products/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === editData.id ? { ...p, ...updated } : p)));
      setEditingId(null);
      setEditData(null);
      showToast('Product saved successfully');
    } catch {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getBasePrice(tiers: PricingTier[]) {
    if (!tiers || !tiers.length) return '\u2014';
    // Return the first (highest) tier price as the "base" price
    const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    return formatPrice(sorted[0].pricePerUnit);
  }

  function getPriceRange(tiers: PricingTier[]) {
    if (!tiers || !tiers.length) return '\u2014';
    const prices = tiers.map((t) => t.pricePerUnit);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `${formatPrice(min)} \u2013 ${formatPrice(max)}`;
  }

  function getSize(product: ProductRow) {
    return product.displaySize || product.dimensions?.displaySize || '\u2014';
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.shape || '').toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your tin tacker sign catalog ({products.length} products)
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
            placeholder="Search by name, shape, or category..."
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Shape
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => {
                  const isEditing = editingId === product.id;
                  const isExpanded = expandedId === product.id;

                  return (
                    <React.Fragment key={product.id}>
                      <tr className={`transition-colors ${isEditing ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-4 py-3.5">
                          {isEditing && editData ? (
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{product.slug}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {isEditing && editData ? (
                            <select
                              value={editData.shape}
                              onChange={(e) => setEditData({ ...editData, shape: e.target.value })}
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {['square', 'rectangle', 'circle', 'can', 'bottle-cap', 'die-cut', 'shield', 'arrow', 'street-sign', 'license-plate'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                              {product.shape || product.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-xs">
                          {getSize(product)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-600 font-mono text-xs">
                          {getBasePrice(product.pricingTiers)}
                          <div className="text-[10px] text-gray-400">{getPriceRange(product.pricingTiers)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isEditing && editData ? (
                            <button
                              type="button"
                              onClick={() => setEditData({ ...editData, inStock: !editData.inStock })}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                editData.inStock
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {editData.inStock ? 'Active' : 'Draft'}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.inStock
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {product.inStock ? 'Active' : 'Draft'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isEditing && editData ? (
                            <button
                              type="button"
                              onClick={() => setEditData({ ...editData, featured: !editData.featured })}
                              className="mx-auto"
                            >
                              {editData.featured ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50">
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
                                  <X className="w-3.5 h-3.5 text-gray-300" />
                                </span>
                              )}
                            </button>
                          ) : product.featured ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
                              <X className="w-3.5 h-3.5 text-gray-300" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                  title="Save changes"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                  title={isExpanded ? 'Collapse' : 'Expand details'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => startEdit(product)}
                                  className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                  title="Quick edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                  className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Full edit"
                                >
                                  <Package className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(product.id, product.name)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && !isEditing && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Category</dt>
                                <dd className="text-gray-900 capitalize">{product.category}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Min Order</dt>
                                <dd className="text-gray-900">{product.minimumOrder || '\u2014'} units</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Lead Time</dt>
                                <dd className="text-gray-900">{product.leadTimeDays || '\u2014'} days</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Setup Fee</dt>
                                <dd className="text-gray-900">{product.setupFee ? formatPrice(product.setupFee) : '$0.00'}</dd>
                              </div>
                            </div>

                            {product.shortDescription && (
                              <div className="mt-3">
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Description</dt>
                                <dd className="text-gray-700 text-sm">{product.shortDescription}</dd>
                              </div>
                            )}

                            {/* Pricing tiers */}
                            {product.pricingTiers && product.pricingTiers.length > 0 && (
                              <div className="mt-3">
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pricing Tiers</dt>
                                <div className="flex flex-wrap gap-2">
                                  {product.pricingTiers.map((tier, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs">
                                      <span className="text-gray-500">{tier.minQuantity}{tier.maxQuantity ? `-${tier.maxQuantity}` : '+'}</span>
                                      <span className="mx-1.5 text-gray-300">|</span>
                                      <span className="font-medium text-gray-900">{formatPrice(tier.pricePerUnit)}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => startEdit(product)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Quick Edit
                              </button>
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Full Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      )}
    </div>
  );
}

