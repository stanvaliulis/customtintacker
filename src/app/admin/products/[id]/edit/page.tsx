'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Normalize static product data (nested) into the flat format ProductForm expects */
function normalizeProduct(raw: any) {
  // If it already has top-level `width`/`height` it's DB format — use as-is
  if (typeof raw.width === 'number') return raw;

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    shortDescription: raw.shortDescription,
    longDescription: raw.longDescription,
    category: raw.category,
    shape: raw.shape,
    width: raw.dimensions?.width ?? 12,
    height: raw.dimensions?.height ?? 12,
    displaySize: raw.dimensions?.displaySize ?? '',
    wholesaleDiscount: raw.wholesaleDiscount ?? 0.20,
    minimumOrder: raw.minimumOrder ?? 25,
    leadTimeDays: raw.leadTimeDays ?? 30,
    setupFee: raw.setupFee ?? 20000,
    inStock: raw.inStock ?? true,
    featured: raw.featured ?? false,
    sortOrder: raw.sortOrder ?? 0,
    material: raw.metadata?.material ?? 'Recycled Aluminum',
    printMethod: raw.metadata?.printMethod ?? 'Silkscreen / 4-Color Process',
    mountingHoles: raw.metadata?.mountingHoles ?? 2,
    shrinkWrapped: raw.metadata?.shrinkWrapped ?? true,
    madeInUSA: raw.metadata?.madeInUSA ?? true,
    // Normalize images: static = string[], DB = {url, alt, sortOrder}[]
    images: Array.isArray(raw.images)
      ? raw.images.map((img: any, i: number) =>
          typeof img === 'string'
            ? { url: img, alt: raw.name, sortOrder: i }
            : img
        )
      : [],
    // Pricing tiers are the same shape in both formats
    pricingTiers: raw.pricingTiers ?? [],
    // Backing options: static = string[], DB = {backingId}[]
    backingOptions: Array.isArray(raw.backingOptions)
      ? raw.backingOptions.map((b: any) =>
          typeof b === 'string' ? { backingId: b } : b
        )
      : [],
    // Features: static = string[], DB = {text, sortOrder}[]
    features: Array.isArray(raw.features)
      ? raw.features.map((f: any, i: number) =>
          typeof f === 'string' ? { text: f, sortOrder: i } : f
        )
      : [],
  };
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setProduct(normalizeProduct(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading product...</span>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!product) return <div className="p-8 text-gray-500">Product not found.</div>;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit: {product.name}</h1>
      <ProductForm initialData={product} />
    </div>
  );
}
