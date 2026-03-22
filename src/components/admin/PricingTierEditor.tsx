'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface TierRow {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
}

interface PricingTierEditorProps {
  tiers: TierRow[];
  onChange: (tiers: TierRow[]) => void;
}

export default function PricingTierEditor({ tiers, onChange }: PricingTierEditorProps) {
  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.maxQuantity ?? lastTier.minQuantity) + 1 : 25;
    onChange([...tiers, { minQuantity: newMin, maxQuantity: null, pricePerUnit: 0 }]);
  }

  function removeTier(index: number) {
    onChange(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof TierRow, value: number | null) {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">Pricing Tiers</label>
        <button
          type="button"
          onClick={addTier}
          className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tier
        </button>
      </div>

      {tiers.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-300 rounded-lg">
          No pricing tiers. Click &quot;Add Tier&quot; to add one.
        </p>
      )}

      {tiers.map((tier, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Min Qty</label>
              <input
                type="number"
                min={1}
                value={tier.minQuantity}
                onChange={(e) => updateTier(i, 'minQuantity', parseInt(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Qty</label>
              <input
                type="number"
                min={tier.minQuantity}
                value={tier.maxQuantity ?? ''}
                placeholder="No limit"
                onChange={(e) => updateTier(i, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Price (cents)</label>
              <input
                type="number"
                min={0}
                value={tier.pricePerUnit}
                onChange={(e) => updateTier(i, 'pricePerUnit', parseInt(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeTier(i)}
            className="p-1.5 text-gray-400 hover:text-red-500 mt-4"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
