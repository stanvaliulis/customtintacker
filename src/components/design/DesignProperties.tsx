'use client';

import { useState, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SelectedObjectType = 'text' | 'image' | 'shape' | null;

export interface ObjectProperties {
  id: string;
  type: SelectedObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  // Text-specific
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

interface DesignPropertiesProps {
  selectedObject: ObjectProperties | null;
  onUpdateProperty: (property: string, value: number | string | boolean) => void;
  onDelete: () => void;
}

/* ------------------------------------------------------------------ */
/*  Font options                                                       */
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
];

/* ------------------------------------------------------------------ */
/*  Inline property input                                              */
/* ------------------------------------------------------------------ */

function PropertyInput({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center bg-gray-800 rounded-md border border-gray-700 overflow-hidden">
        <input
          type="number"
          value={Math.round(value * 100) / 100}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-sm text-gray-200 px-2 py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="text-[11px] text-gray-500 pr-2 select-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function DesignProperties({
  selectedObject,
  onUpdateProperty,
  onDelete,
}: DesignPropertiesProps) {
  const [lockAspectRatio, setLockAspectRatio] = useState(false);

  const handleSizeChange = useCallback(
    (dim: 'width' | 'height', value: number) => {
      if (!selectedObject) return;

      if (lockAspectRatio) {
        const ratio =
          dim === 'width'
            ? selectedObject.height / selectedObject.width
            : selectedObject.width / selectedObject.height;
        onUpdateProperty(dim, value);
        onUpdateProperty(
          dim === 'width' ? 'height' : 'width',
          Math.round(value * ratio),
        );
      } else {
        onUpdateProperty(dim, value);
      }
    },
    [selectedObject, lockAspectRatio, onUpdateProperty],
  );

  if (!selectedObject) return null;

  const isText = selectedObject.type === 'text';

  return (
    <div className="hidden md:flex flex-col w-[260px] shrink-0 bg-gray-900 border-l border-gray-800 overflow-y-auto">
      {/* ---- Header ---- */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-200 capitalize">
          {selectedObject.type} Properties
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ---- Position ---- */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Position
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="X"
              value={selectedObject.x}
              suffix="px"
              onChange={(v) => onUpdateProperty('x', v)}
            />
            <PropertyInput
              label="Y"
              value={selectedObject.y}
              suffix="px"
              onChange={(v) => onUpdateProperty('y', v)}
            />
          </div>
        </section>

        {/* ---- Size ---- */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Size
            </h4>
            <button
              type="button"
              onClick={() => setLockAspectRatio((prev) => !prev)}
              title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              className={cn(
                'p-1 rounded transition-colors',
                lockAspectRatio
                  ? 'text-amber-400 bg-gray-800'
                  : 'text-gray-600 hover:text-gray-400',
              )}
            >
              {lockAspectRatio ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PropertyInput
              label="W"
              value={selectedObject.width}
              suffix="px"
              min={1}
              onChange={(v) => handleSizeChange('width', v)}
            />
            <PropertyInput
              label="H"
              value={selectedObject.height}
              suffix="px"
              min={1}
              onChange={(v) => handleSizeChange('height', v)}
            />
          </div>
        </section>

        {/* ---- Rotation ---- */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Rotation
          </h4>
          <PropertyInput
            label="Angle"
            value={selectedObject.rotation}
            suffix="deg"
            min={-360}
            max={360}
            onChange={(v) => onUpdateProperty('rotation', v)}
          />
        </section>

        {/* ---- Opacity ---- */}
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Opacity
          </h4>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(selectedObject.opacity * 100)}
              onChange={(e) => onUpdateProperty('opacity', Number(e.target.value) / 100)}
              className="flex-1 h-1.5 rounded-full appearance-none bg-gray-700 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-mono w-9 text-right">
              {Math.round(selectedObject.opacity * 100)}%
            </span>
          </div>
        </section>

        {/* ---- Text-specific properties ---- */}
        {isText && (
          <>
            {/* Font family */}
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Font
              </h4>
              <select
                value={selectedObject.fontFamily ?? 'Arial'}
                onChange={(e) => onUpdateProperty('fontFamily', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </section>

            {/* Font size */}
            <section>
              <PropertyInput
                label="Font Size"
                value={selectedObject.fontSize ?? 16}
                suffix="px"
                min={1}
                max={800}
                onChange={(v) => onUpdateProperty('fontSize', v)}
              />
            </section>

            {/* Color */}
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Color
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => onUpdateProperty('fontColor', color)}
                    className={cn(
                      'w-6 h-6 rounded border transition-all',
                      selectedObject.fontColor === color
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
                  value={selectedObject.fontColor ?? '#000000'}
                  onChange={(e) => onUpdateProperty('fontColor', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={selectedObject.fontColor ?? '#000000'}
                  onChange={(e) => onUpdateProperty('fontColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </section>

            {/* Formatting toggles */}
            <section>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Style
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Bold"
                  onClick={() => onUpdateProperty('bold', !selectedObject.bold)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.bold
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => onUpdateProperty('italic', !selectedObject.italic)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.italic
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Underline"
                  onClick={() => onUpdateProperty('underline', !selectedObject.underline)}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.underline
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-1" />

                <button
                  type="button"
                  title="Align Left"
                  onClick={() => onUpdateProperty('textAlign', 'left')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.textAlign === 'left'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Align Center"
                  onClick={() => onUpdateProperty('textAlign', 'center')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.textAlign === 'center'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Align Right"
                  onClick={() => onUpdateProperty('textAlign', 'right')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                    selectedObject.textAlign === 'right'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent',
                  )}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ---- Delete button ---- */}
      <div className="p-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Object
        </button>
      </div>
    </div>
  );
}
