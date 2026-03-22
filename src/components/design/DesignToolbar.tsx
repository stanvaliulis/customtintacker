'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  Ruler,
  Scan,
  Save,
  Download,
  ShoppingCart,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DesignExportFormat } from '@/types/design';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DesignToolbarProps {
  productName: string;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  showBleed: boolean;
  showSafeArea: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleBleed: () => void;
  onToggleSafeArea: () => void;
  onPreview: () => void;
  onSave: () => void;
  onExport: (format: DesignExportFormat) => void;
  onAddToCart: () => void;
}

/* ------------------------------------------------------------------ */
/*  Reusable icon button                                               */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  children,
  label,
  active,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
        'text-gray-400 hover:text-white hover:bg-gray-700',
        'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400',
        active && 'text-amber-400 bg-gray-700',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Separator                                                          */
/* ------------------------------------------------------------------ */

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-700 mx-1" />;
}

/* ------------------------------------------------------------------ */
/*  Export dropdown                                                     */
/* ------------------------------------------------------------------ */

function ExportDropdown({
  onExport,
}: {
  onExport: (format: DesignExportFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formats: { format: DesignExportFormat; label: string; icon: React.ReactNode }[] = [
    { format: 'png', label: 'PNG Image', icon: <ImageIcon className="w-4 h-4" /> },
    { format: 'svg', label: 'SVG Vector', icon: <FileCode className="w-4 h-4" /> },
    { format: 'pdf', label: 'PDF Document', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1 h-8 px-2 rounded-md text-sm transition-colors',
          'text-gray-400 hover:text-white hover:bg-gray-700',
        )}
      >
        <Download className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          {formats.map(({ format, label, icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                onExport(format);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main toolbar component                                             */
/* ------------------------------------------------------------------ */

export default function DesignToolbar({
  productName,
  zoom,
  canUndo,
  canRedo,
  showBleed,
  showSafeArea,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onToggleBleed,
  onToggleSafeArea,
  onPreview,
  onSave,
  onExport,
  onAddToCart,
}: DesignToolbarProps) {
  return (
    <div className="flex items-center justify-between h-12 px-3 bg-gray-900 border-b border-gray-800 shrink-0">
      {/* ---- Left group ---- */}
      <div className="flex items-center gap-1">
        <ToolbarButton label="Undo" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton label="Zoom In" onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Zoom Out" onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </ToolbarButton>
        <span className="text-xs text-gray-500 font-mono w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* ---- Center ---- */}
      <div className="hidden sm:block text-sm font-medium text-gray-300 truncate max-w-[240px]">
        {productName}
      </div>

      {/* ---- Right group ---- */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          label="Toggle Bleed Guide"
          active={showBleed}
          onClick={onToggleBleed}
        >
          <Scan className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Toggle Safe Area"
          active={showSafeArea}
          onClick={onToggleSafeArea}
        >
          <Ruler className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton label="Preview" onClick={onPreview}>
          <Eye className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton label="Save" onClick={onSave}>
          <Save className="w-4 h-4" />
        </ToolbarButton>

        <ExportDropdown onExport={onExport} />

        <ToolbarSeparator />

        <button
          type="button"
          onClick={onAddToCart}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden md:inline">Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
