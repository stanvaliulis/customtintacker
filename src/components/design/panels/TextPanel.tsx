'use client';

import { useState } from 'react';
import { Type, Heading1, Heading2, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TextPanelProps {
  onAddText: (preset: 'heading' | 'subheading' | 'body') => void;
}

/* ------------------------------------------------------------------ */
/*  Font options (web-safe)                                            */
/* ------------------------------------------------------------------ */

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
  'Lucida Console',
  'Arial Black',
];

/* ------------------------------------------------------------------ */
/*  Preset color swatches                                              */
/* ------------------------------------------------------------------ */

const COLOR_SWATCHES = [
  '#000000', '#FFFFFF', '#D97706', '#DC2626',
  '#2563EB', '#16A34A', '#9333EA', '#EC4899',
  '#F59E0B', '#0891B2', '#4B5563', '#1E293B',
  '#7C3AED', '#059669', '#B91C1C', '#CA8A04',
];

/* ------------------------------------------------------------------ */
/*  Text preset buttons                                                */
/* ------------------------------------------------------------------ */

const TEXT_PRESETS: {
  id: 'heading' | 'subheading' | 'body';
  label: string;
  description: string;
  icon: React.ReactNode;
  previewClass: string;
}[] = [
  {
    id: 'heading',
    label: 'Add Heading',
    description: 'Large, bold title text',
    icon: <Heading1 className="w-5 h-5" />,
    previewClass: 'text-lg font-bold',
  },
  {
    id: 'subheading',
    label: 'Add Subheading',
    description: 'Medium, semi-bold text',
    icon: <Heading2 className="w-5 h-5" />,
    previewClass: 'text-base font-semibold',
  },
  {
    id: 'body',
    label: 'Add Body Text',
    description: 'Regular paragraph text',
    icon: <AlignLeft className="w-5 h-5" />,
    previewClass: 'text-sm font-normal',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TextPanel({ onAddText }: TextPanelProps) {
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [customHex, setCustomHex] = useState('#000000');

  return (
    <div className="space-y-5">
      {/* ---- Text preset buttons ---- */}
      <section className="space-y-2">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onAddText(preset.id)}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-amber-600/50 hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-700 text-gray-400 shrink-0">
              {preset.icon}
            </div>
            <div>
              <span className={cn('block text-gray-200', preset.previewClass)}>
                {preset.label}
              </span>
              <span className="block text-[11px] text-gray-500 mt-0.5">
                {preset.description}
              </span>
            </div>
          </button>
        ))}
      </section>

      {/* ---- Font family selector ---- */}
      <section>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Font Family
        </h4>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        {/* Font preview */}
        <div
          className="mt-2 px-3 py-2 bg-gray-800 rounded-md text-gray-300 text-sm"
          style={{ fontFamily: selectedFont }}
        >
          The quick brown fox jumps...
        </div>
      </section>

      {/* ---- Color picker ---- */}
      <section>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Text Color
        </h4>
        {/* Preset swatches */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => {
                setSelectedColor(color);
                setCustomHex(color);
              }}
              className={cn(
                'w-6 h-6 rounded border transition-all',
                selectedColor === color
                  ? 'border-amber-400 ring-1 ring-amber-400 scale-110'
                  : 'border-gray-600 hover:border-gray-400',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        {/* Custom hex input */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => {
              setSelectedColor(e.target.value);
              setCustomHex(e.target.value);
            }}
            className="w-8 h-8 rounded border border-gray-700 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => {
              setCustomHex(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setSelectedColor(e.target.value);
              }
            }}
            placeholder="#000000"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>
      </section>
    </div>
  );
}
