'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PricingTierEditor, { TierRow } from './PricingTierEditor';
import ImageUploader, { ImageRow } from './ImageUploader';

const categories = [
  { value: 'standard', label: 'Standard' },
  { value: 'circle', label: 'Circle' },
  { value: 'can-shape', label: 'Can Shape' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'custom', label: 'Custom' },
];

const shapes = [
  'square', 'rectangle', 'circle', 'can', 'bottle-cap', 'die-cut', 'shield', 'arrow',
];

const allBackingOptions = [
  { id: 'standard-024', label: 'Standard (.024")' },
];

interface ProductFormProps {
  initialData?: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    longDescription: string;
    category: string;
    shape: string;
    width: number;
    height: number;
    displaySize: string;
    wholesaleDiscount: number;
    minimumOrder: number;
    leadTimeDays: number;
    setupFee: number;
    inStock: boolean;
    featured: boolean;
    sortOrder: number;
    material: string;
    printMethod: string;
    mountingHoles: number;
    shrinkWrapped: boolean;
    madeInUSA: boolean;
    images: { url: string; alt: string; sortOrder: number }[];
    pricingTiers: { minQuantity: number; maxQuantity: number | null; pricePerUnit: number }[];
    backingOptions: { backingId: string }[];
    features: { text: string; sortOrder: number }[];
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [longDescription, setLongDescription] = useState(initialData?.longDescription || '');
  const [category, setCategory] = useState(initialData?.category || 'standard');
  const [shape, setShape] = useState(initialData?.shape || 'square');
  const [width, setWidth] = useState(initialData?.width || 12);
  const [height, setHeight] = useState(initialData?.height || 12);
  const [displaySize, setDisplaySize] = useState(initialData?.displaySize || '');
  const [wholesaleDiscount, setWholesaleDiscount] = useState(initialData?.wholesaleDiscount ?? 0.20);
  const [minimumOrder, setMinimumOrder] = useState(initialData?.minimumOrder || 25);
  const [leadTimeDays, setLeadTimeDays] = useState(initialData?.leadTimeDays || 30);
  const [setupFee, setSetupFee] = useState(initialData?.setupFee || 20000);
  const [inStock, setInStock] = useState(initialData?.inStock ?? true);
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 0);
  const [mountingHoles, setMountingHoles] = useState(initialData?.mountingHoles || 2);
  const [shrinkWrapped, setShrinkWrapped] = useState(initialData?.shrinkWrapped ?? true);

  const [images, setImages] = useState<ImageRow[]>(initialData?.images || []);
  const [pricingTiers, setPricingTiers] = useState<TierRow[]>(
    initialData?.pricingTiers || []
  );
  const [selectedBackings, setSelectedBackings] = useState<string[]>(
    initialData?.backingOptions?.map((b) => b.backingId) || ['standard-024', 'heavy-032', 'premium-040']
  );
  const [features, setFeatures] = useState<string[]>(
    initialData?.features?.map((f) => f.text) || []
  );
  const [newFeature, setNewFeature] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!isEdit) {
      setSlug(slugify(value));
    }
  }

  function addFeature() {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  }

  function removeFeature(index: number) {
    setFeatures(features.filter((_, i) => i !== index));
  }

  function toggleBacking(id: string) {
    setSelectedBackings((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      slug,
      name,
      shortDescription,
      longDescription,
      category,
      shape,
      width,
      height,
      displaySize,
      wholesaleDiscount,
      minimumOrder,
      leadTimeDays,
      setupFee,
      inStock,
      featured,
      sortOrder,
      material: 'Recycled Aluminum',
      printMethod: 'Silkscreen / 4-Color Process',
      mountingHoles,
      shrinkWrapped,
      madeInUSA: true,
      images: images.map((img, i) => ({ url: img.url, alt: img.alt, sortOrder: i })),
      pricingTiers: pricingTiers.map((t) => ({
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        pricePerUnit: t.pricePerUnit,
      })),
      backingOptions: selectedBackings,
      features,
    };

    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
            <textarea
              required
              rows={4}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Product Details */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
            <select value={shape} onChange={(e) => setShape(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {shapes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Size</label>
            <input type="text" value={displaySize} onChange={(e) => setDisplaySize(e.target.value)} placeholder='e.g., 12" x 12"' className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width (inches)</label>
            <input type="number" step="0.25" value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (inches)</label>
            <input type="number" step="0.25" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Holes</label>
            <input type="number" min={0} value={mountingHoles} onChange={(e) => setMountingHoles(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <ImageUploader images={images} onChange={setImages} />
      </section>

      {/* Pricing */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <PricingTierEditor tiers={pricingTiers} onChange={setPricingTiers} />
      </section>

      {/* Settings */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order</label>
            <input type="number" min={1} value={minimumOrder} onChange={(e) => setMinimumOrder(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days)</label>
            <input type="number" min={1} value={leadTimeDays} onChange={(e) => setLeadTimeDays(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setup Fee (cents)</label>
            <input type="number" min={0} value={setupFee} onChange={(e) => setSetupFee(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Discount</label>
            <input type="number" step="0.01" min={0} max={1} value={wholesaleDiscount} onChange={(e) => setWholesaleDiscount(parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-amber-600" />
            <span className="text-sm text-gray-700">In Stock</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-amber-600" />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={shrinkWrapped} onChange={(e) => setShrinkWrapped(e.target.checked)} className="accent-amber-600" />
            <span className="text-sm text-gray-700">Shrink Wrapped</span>
          </label>
        </div>
      </section>

      {/* Backing Options */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Backing Options</h2>
        <div className="space-y-2">
          {allBackingOptions.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedBackings.includes(opt.id)}
                onChange={() => toggleBacking(opt.id)}
                className="accent-amber-600"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
        <ul className="space-y-1 mb-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
              <span>{f}</span>
              <button type="button" onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500">
                &times;
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            placeholder="Add a feature"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={addFeature} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">
            Add
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
