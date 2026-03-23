'use client';

import { ProductShape } from '@/types/product';

interface ShapeOption {
  id: ProductShape;
  label: string;
  icon: React.ReactNode;
  aspectRatio: number; // width / height for preview sizing
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'rectangle',
    label: 'Rectangle',
    aspectRatio: 480 / 360,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="4" y="14" width="56" height="36" rx="3" />
      </svg>
    ),
  },
  {
    id: 'square',
    label: 'Square',
    aspectRatio: 1,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="8" y="8" width="48" height="48" rx="3" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    aspectRatio: 1,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="32" cy="32" r="26" />
      </svg>
    ),
  },
  {
    id: 'can',
    label: 'Can Shape',
    aspectRatio: 300 / 500,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8 C18 8 22 4 32 4 C42 4 46 8 46 8 L46 56 C46 56 42 60 32 60 C22 60 18 56 18 56 Z" />
        <ellipse cx="32" cy="8" rx="14" ry="4" />
      </svg>
    ),
  },
  {
    id: 'bottle-cap',
    label: 'Bottle Cap',
    aspectRatio: 1,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 4 L36 10 L44 8 L42 16 L50 18 L46 24 L52 30 L46 34 L50 40 L42 42 L44 50 L36 48 L32 54 L28 48 L20 50 L22 42 L14 40 L18 34 L12 30 L18 24 L14 18 L22 16 L20 8 L28 10 Z" />
      </svg>
    ),
  },
  {
    id: 'die-cut',
    label: 'Die-Cut',
    aspectRatio: 1,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M28 6 C18 7 10 14 10 24 C10 34 8 38 12 46 C16 54 24 58 32 58 C40 58 48 52 52 44 C56 36 56 26 52 18 C48 10 38 5 28 6 Z" />
      </svg>
    ),
  },
  {
    id: 'shield',
    label: 'Shield',
    aspectRatio: 360 / 440,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 6 L52 14 L52 34 C52 44 44 52 32 58 C20 52 12 44 12 34 L12 14 Z" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    aspectRatio: 500 / 320,
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M4 32 L16 18 L16 24 L48 24 L48 18 L60 32 L48 46 L48 40 L16 40 L16 46 Z" />
      </svg>
    ),
  },
];

interface ShapeSelectorProps {
  selectedShape: ProductShape;
  onShapeChange: (shape: ProductShape) => void;
}

export default function ShapeSelector({ selectedShape, onShapeChange }: ShapeSelectorProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {SHAPE_OPTIONS.map((shape) => {
        const isSelected = shape.id === selectedShape;
        return (
          <button
            key={shape.id}
            onClick={() => onShapeChange(shape.id)}
            className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            <div className="transition-transform duration-200 group-hover:scale-110">
              {shape.icon}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{shape.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { SHAPE_OPTIONS };
export type { ShapeOption };
