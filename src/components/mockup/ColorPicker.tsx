'use client';

import { useState } from 'react';

interface ColorPreset {
  name: string;
  value: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Aluminum', value: '#C0C0C0' },
  { name: 'Craft', value: '#8B6914' },
  { name: 'Navy', value: '#1B2A4A' },
  { name: 'Red', value: '#B91C1C' },
  { name: 'Green', value: '#15803D' },
  { name: 'Gold', value: '#D4A843' },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export default function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(selectedColor);
  const isCustom = !COLOR_PRESETS.some((p) => p.value === selectedColor);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {COLOR_PRESETS.map((preset) => {
        const isSelected = preset.value === selectedColor;
        return (
          <button
            key={preset.value}
            onClick={() => onColorChange(preset.value)}
            title={preset.name}
            className={`group relative w-10 h-10 rounded-full border-2 transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-amber-500 scale-110 shadow-lg shadow-amber-500/20'
                : 'border-gray-600 hover:border-gray-400 hover:scale-105'
            }`}
          >
            <div
              className="absolute inset-0.5 rounded-full"
              style={{ backgroundColor: preset.value }}
            />
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className={`w-5 h-5 ${preset.value === '#FFFFFF' || preset.value === '#C0C0C0' ? 'text-gray-800' : 'text-white'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {preset.name}
            </span>
          </button>
        );
      })}

      {/* Custom color */}
      <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-700">
        <label className="text-xs text-gray-500 font-medium">Custom:</label>
        <div className="relative">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onColorChange(e.target.value);
            }}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
            style={{ appearance: 'none' }}
          />
          <div
            className={`absolute inset-0 rounded-lg border-2 pointer-events-none transition-all ${
              isCustom ? 'border-amber-500' : 'border-gray-600'
            }`}
            style={{ backgroundColor: customColor }}
          />
        </div>
        <input
          type="text"
          value={selectedColor}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              setCustomColor(val);
              onColorChange(val);
            }
          }}
          placeholder="#000000"
          className="w-20 px-2 py-1.5 text-xs font-mono bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}
