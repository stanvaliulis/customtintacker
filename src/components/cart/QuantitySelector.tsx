'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  min: number;
  onChange: (quantity: number) => void;
}

export default function QuantitySelector({ quantity, min, onChange }: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-gray-300 rounded-lg">
      <button
        onClick={() => onChange(Math.max(min, quantity - 25))}
        disabled={quantity <= min}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={quantity}
        min={min}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
        className="w-20 text-center border-x border-gray-300 py-1.5 text-sm focus:outline-none"
      />
      <button
        onClick={() => onChange(quantity + 25)}
        className="p-2 text-gray-500 hover:text-gray-700"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
