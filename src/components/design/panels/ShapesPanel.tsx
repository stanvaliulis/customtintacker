'use client';

import { useState } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ShapesPanelProps {
  onAddShape: (type: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Shape definitions                                                  */
/* ------------------------------------------------------------------ */

interface ShapeDef {
  type: string;
  label: string;
  icon: React.ReactNode;
}

const SHAPES: ShapeDef[] = [
  { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-6 h-6" /> },
  { type: 'circle',    label: 'Circle',    icon: <Circle className="w-6 h-6" /> },
  { type: 'triangle',  label: 'Triangle',  icon: <Triangle className="w-6 h-6" /> },
  { type: 'star',      label: 'Star',      icon: <Star className="w-6 h-6" /> },
  { type: 'line',      label: 'Line',      icon: <Minus className="w-6 h-6" /> },
  { type: 'arrow',     label: 'Arrow',     icon: <ArrowRight className="w-6 h-6" /> },
];

/* ------------------------------------------------------------------ */
/*  Preset color swatches                                              */
/* ------------------------------------------------------------------ */

const FILL_SWATCHES = [
  '#D97706', '#DC2626', '#2563EB', '#16A34A',
  '#9333EA', '#EC4899', '#F59E0B', '#0891B2',
  '#000000', '#FFFFFF', '#4B5563', '#1E293B',
];

const STROKE_SWATCHES = [
  '#000000', '#FFFFFF', '#D97706', '#DC2626',
  '#2563EB', '#16A34A', '#9333EA', '#4B5563',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ShapesPanel({ onAddShape }: ShapesPanelProps) {
  const [fillColor, setFillColor] = useState('#D97706');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [customFill, setCustomFill] = useState('#D97706');
  const [customStroke, setCustomStroke] = useState('#000000');

  return (
    <div className="space-y-5">
      {/* ---- Shape grid ---- */}
      <section>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Basic Shapes
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.type}
              type="button"
              onClick={() => onAddShape(shape.type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-amber-600/50 hover:bg-gray-800 hover:text-amber-400 transition-colors"
            >
              {shape.icon}
              <span className="text-[10px] font-medium">{shape.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Fill color ---- */}
      <section>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Fill Color
        </h4>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FILL_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => {
                setFillColor(color);
                setCustomFill(color);
              }}
              className={cn(
                'w-6 h-6 rounded border transition-all',
                fillColor === color
                  ? 'border-amber-400 ring-1 ring-amber-400 scale-110'
                  : 'border-gray-600 hover:border-gray-400',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => {
              setFillColor(e.target.value);
              setCustomFill(e.target.value);
            }}
            className="w-8 h-8 rounded border border-gray-700 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={customFill}
            onChange={(e) => {
              setCustomFill(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setFillColor(e.target.value);
              }
            }}
            placeholder="#D97706"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>
      </section>

      {/* ---- Stroke color ---- */}
      <section>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Stroke Color
        </h4>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {STROKE_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => {
                setStrokeColor(color);
                setCustomStroke(color);
              }}
              className={cn(
                'w-6 h-6 rounded border transition-all',
                strokeColor === color
                  ? 'border-amber-400 ring-1 ring-amber-400 scale-110'
                  : 'border-gray-600 hover:border-gray-400',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => {
              setStrokeColor(e.target.value);
              setCustomStroke(e.target.value);
            }}
            className="w-8 h-8 rounded border border-gray-700 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={customStroke}
            onChange={(e) => {
              setCustomStroke(e.target.value);
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setStrokeColor(e.target.value);
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
