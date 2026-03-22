'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Canvas } from 'fabric';
import type { ProductShape } from '@/types/product';
import { useDesignCanvas } from '@/hooks/useDesignCanvas';
import { inchesToPixels, getBleedOffset, getSafeAreaOffset } from '@/lib/design/bleed';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DesignCanvasProps {
  shape: ProductShape;
  widthInches: number;
  heightInches: number;
  onCanvasReady?: (canvas: Canvas) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DesignCanvas({
  shape,
  widthInches,
  heightInches,
  onCanvasReady,
}: DesignCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const widthPx = inchesToPixels(widthInches);
  const heightPx = inchesToPixels(heightInches);

  const {
    canvas,
    zoomIn,
    zoomOut,
  } = useDesignCanvas({
    canvasRef: canvasElRef,
    width: widthPx,
    height: heightPx,
    shape,
  });

  /* ---- Notify parent when canvas is ready ------------------------ */
  useEffect(() => {
    if (canvas && onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  /* ---- Track zoom level ------------------------------------------ */
  useEffect(() => {
    if (!canvas) return;
    const updateZoom = () => setZoom(canvas.getZoom());
    canvas.on('after:render', updateZoom);
    return () => {
      canvas.off('after:render', updateZoom);
    };
  }, [canvas]);

  /* ---- Compute display dimensions for overlays ------------------- */
  const aspectRatio = widthInches / heightInches;
  const canvasDisplayWidth = 600;
  const canvasDisplayHeight = canvasDisplayWidth / aspectRatio;
  const bleedPx = getBleedOffset();
  const safePx = getSafeAreaOffset();

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex items-center justify-center overflow-hidden bg-gray-800"
    >
      {/* Checkered / light background behind the sign */}
      <div
        className="relative bg-white shadow-2xl"
        style={{
          width: canvasDisplayWidth,
          height: canvasDisplayHeight,
          maxWidth: '90%',
          maxHeight: '90%',
          borderRadius: shape === 'circle' || shape === 'bottle-cap' ? '50%' : 4,
        }}
      >
        {/* Fabric.js canvas element */}
        <canvas ref={canvasElRef} id="design-canvas" />

        {/* Bleed guide overlay (red dashed) */}
        <div
          className="absolute pointer-events-none border-2 border-dashed border-red-500/60"
          style={{
            top: -bleedPx,
            left: -bleedPx,
            right: -bleedPx,
            bottom: -bleedPx,
            borderRadius:
              shape === 'circle' || shape === 'bottle-cap' ? '50%' : 6,
          }}
        />

        {/* Safe area guide overlay (green dashed) */}
        <div
          className="absolute pointer-events-none border-2 border-dashed border-green-500/60"
          style={{
            top: safePx,
            left: safePx,
            right: safePx,
            bottom: safePx,
            borderRadius:
              shape === 'circle' || shape === 'bottle-cap' ? '50%' : 2,
          }}
        />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={zoomOut}
          className="bg-gray-900/80 text-gray-300 text-xs font-mono px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          aria-label="Zoom out"
        >
          -
        </button>
        <span className="bg-gray-900/80 text-gray-300 text-xs font-mono px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          className="bg-gray-900/80 text-gray-300 text-xs font-mono px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}
