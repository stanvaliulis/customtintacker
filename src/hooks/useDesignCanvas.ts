'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Canvas,
  Rect,
  Circle,
  Ellipse,
  Path,
  Textbox,
  FabricImage,
  ActiveSelection,
  type FabricObject,
  util,
} from 'fabric';
import type { ProductShape } from '@/types/product';
import { getShapeDefinition } from '@/lib/design/shapes';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

export interface UseDesignCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  shape: ProductShape;
  onModified?: () => void;
}

export interface UseDesignCanvasReturn {
  canvas: Canvas | null;
  addText: (text?: string) => void;
  addImage: (url: string) => Promise<void>;
  addShape: (type: 'rect' | 'circle' | 'ellipse') => void;
  deleteSelected: () => void;
  selectAll: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toJSON: () => Record<string, unknown>;
  loadFromJSON: (json: Record<string, unknown> | string) => Promise<void>;
  exportPNG: () => string;
  exportSVG: () => string;
}

export function useDesignCanvas(options: UseDesignCanvasOptions): UseDesignCanvasReturn {
  const { canvasRef, width, height, shape, onModified } = options;

  const fabricRef = useRef<Canvas | null>(null);
  // State so React re-renders when canvas is ready
  const [canvasReady, setCanvasReady] = useState<Canvas | null>(null);

  // ── Initialise / dispose canvas ──────────────────────────────────
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const fc = new Canvas(canvasEl, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    // Apply shape clip-path
    const shapeDef = getShapeDefinition(shape);
    const pathData = shapeDef.getPath(width, height);
    const clipPath = new Path(pathData, {
      originX: 'left',
      originY: 'top',
      absolutePositioned: true,
      selectable: false,
      evented: false,
    });
    fc.clipPath = clipPath;

    fabricRef.current = fc;
    setCanvasReady(fc);
    fc.requestRenderAll();

    return () => {
      fc.dispose();
      fabricRef.current = null;
      setCanvasReady(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, shape]);

  // ── Wire up onModified callback ──────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !onModified) return;

    const handler = () => onModified();
    fc.on('object:modified', handler);
    fc.on('object:added', handler);
    fc.on('object:removed', handler);

    return () => {
      fc.off('object:modified', handler);
      fc.off('object:added', handler);
      fc.off('object:removed', handler);
    };
  }, [onModified, canvasReady]);

  // ── addText ──────────────────────────────────────────────────────
  const addText = useCallback((text = 'Your Text') => {
    const fc = fabricRef.current;
    if (!fc) return;

    const tb = new Textbox(text, {
      left: width / 2 - 100,
      top: height / 2 - 20,
      fontSize: Math.max(24, Math.min(48, width * 0.04)),
      fontFamily: 'Arial',
      fill: '#000000',
      width: Math.min(400, width * 0.6),
      textAlign: 'center',
      editable: true,
    });

    fc.add(tb);
    fc.setActiveObject(tb);
    fc.requestRenderAll();
  }, [width, height]);

  // ── addImage ─────────────────────────────────────────────────────
  const addImage = useCallback(async (url: string) => {
    const fc = fabricRef.current;
    if (!fc) return;

    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });

      const maxW = width * 0.6;
      const maxH = height * 0.6;
      const imgW = img.width ?? 1;
      const imgH = img.height ?? 1;
      const scale = Math.min(maxW / imgW, maxH / imgH, 1);

      img.set({
        left: width / 2 - (imgW * scale) / 2,
        top: height / 2 - (imgH * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });

      fc.add(img);
      fc.setActiveObject(img);
      fc.requestRenderAll();
    } catch (err) {
      console.error('Failed to load image:', err);
    }
  }, [width, height]);

  // ── addShape ─────────────────────────────────────────────────────
  const addShape = useCallback((type: 'rect' | 'circle' | 'ellipse') => {
    const fc = fabricRef.current;
    if (!fc) return;

    let obj: FabricObject;
    const size = Math.min(width, height) * 0.2;
    const baseProps = {
      left: width / 2 - size / 2,
      top: height / 2 - size / 2,
      fill: '#d97706',
      stroke: '#92400e',
      strokeWidth: 2,
    };

    switch (type) {
      case 'rect':
        obj = new Rect({ ...baseProps, width: size, height: size * 0.75 });
        break;
      case 'circle':
        obj = new Circle({ ...baseProps, radius: size / 2 });
        break;
      case 'ellipse':
        obj = new Ellipse({ ...baseProps, rx: size / 2, ry: size / 3 });
        break;
    }

    fc.add(obj);
    fc.setActiveObject(obj);
    fc.requestRenderAll();
  }, [width, height]);

  // ── deleteSelected ───────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const active = fc.getActiveObject();
    if (!active) return;

    if (active instanceof ActiveSelection) {
      const objects = active.getObjects();
      fc.discardActiveObject();
      objects.forEach((obj) => fc.remove(obj));
    } else {
      fc.remove(active);
    }

    fc.requestRenderAll();
  }, []);

  // ── selectAll ────────────────────────────────────────────────────
  const selectAll = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const objects = fc.getObjects();
    if (objects.length === 0) return;

    fc.discardActiveObject();
    const sel = new ActiveSelection(objects, { canvas: fc });
    fc.setActiveObject(sel);
    fc.requestRenderAll();
  }, []);

  // ── Zoom helpers ─────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.min(fc.getZoom() + ZOOM_STEP, MAX_ZOOM);
    fc.setZoom(next);
    fc.requestRenderAll();
  }, []);

  const zoomOut = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.max(fc.getZoom() - ZOOM_STEP, MIN_ZOOM);
    fc.setZoom(next);
    fc.requestRenderAll();
  }, []);

  const resetZoom = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setZoom(1);
    fc.requestRenderAll();
  }, []);

  // ── Serialization ────────────────────────────────────────────────
  const toJSON = useCallback((): Record<string, unknown> => {
    const fc = fabricRef.current;
    if (!fc) return {};
    return fc.toJSON() as Record<string, unknown>;
  }, []);

  /**
   * Load objects from template JSON WITHOUT resetting canvas dimensions or clip-path.
   * Scales objects if the template was designed for different dimensions.
   */
  const loadFromJSON = useCallback(async (json: Record<string, unknown> | string) => {
    const fc = fabricRef.current;
    if (!fc) return;

    const data = typeof json === 'string' ? JSON.parse(json) as Record<string, unknown> : json;
    const objects = data.objects as Record<string, unknown>[] | undefined;
    if (!objects || objects.length === 0) return;

    // Clear existing objects
    fc.clear();

    // Restore white background and clip-path (clear removes them)
    fc.backgroundColor = '#ffffff';
    const shapeDef = getShapeDefinition(shape);
    const pathData = shapeDef.getPath(width, height);
    fc.clipPath = new Path(pathData, {
      originX: 'left',
      originY: 'top',
      absolutePositioned: true,
      selectable: false,
      evented: false,
    });

    // Calculate scale factor if template was designed for different dimensions
    const tplWidth = (data.width as number) || width;
    const tplHeight = (data.height as number) || height;
    const scaleX = width / tplWidth;
    const scaleY = height / tplHeight;
    const scale = Math.min(scaleX, scaleY);

    // Set background from template if it has one
    if (data.background && typeof data.background === 'string') {
      fc.backgroundColor = data.background;
    }

    // Enlist objects one by one using Fabric's util.enlivenObjects
    try {
      const enlivened = await util.enlivenObjects(objects) as FabricObject[];
      for (const obj of enlivened) {
        if (!obj || typeof obj.set !== 'function') continue;
        // Scale position and size to match current canvas
        if (scale !== 1) {
          obj.set({
            left: (obj.left ?? 0) * scale,
            top: (obj.top ?? 0) * scale,
            scaleX: (obj.scaleX ?? 1) * scale,
            scaleY: (obj.scaleY ?? 1) * scale,
          });
        }
        fc.add(obj);
      }
    } catch (err) {
      console.error('Failed to enliven template objects:', err);
    }

    fc.requestRenderAll();
  }, [width, height, shape]);

  // ── Export ───────────────────────────────────────────────────────
  const exportPNG = useCallback((): string => {
    const fc = fabricRef.current;
    if (!fc) return '';
    return fc.toDataURL({ format: 'png', multiplier: 2 });
  }, []);

  const exportSVG = useCallback((): string => {
    const fc = fabricRef.current;
    if (!fc) return '';
    return fc.toSVG();
  }, []);

  return {
    canvas: canvasReady,
    addText,
    addImage,
    addShape,
    deleteSelected,
    selectAll,
    zoomIn,
    zoomOut,
    resetZoom,
    toJSON,
    loadFromJSON,
    exportPNG,
    exportSVG,
  };
}
