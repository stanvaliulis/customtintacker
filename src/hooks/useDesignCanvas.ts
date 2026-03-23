'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Canvas,
  Rect,
  Circle,
  Ellipse,
  Path,
  Line,
  Textbox,
  FabricImage,
  ActiveSelection,
  type FabricObject,
  type TPointerEventInfo,
  type TPointerEvent,
  util,
  Point,
} from 'fabric';
import type { ProductShape } from '@/types/product';
import { getShapeDefinition } from '@/lib/design/shapes';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_SENSITIVITY = 0.001;
const SNAP_THRESHOLD = 8; // px distance to trigger snapping
const EDGE_SNAP_MARGIN = 10; // px from edges for safe area snap

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UseDesignCanvasOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  shape: ProductShape;
  onModified?: () => void;
}

export interface PrintReadyExport {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  dpi: number;
  includesBleed: boolean;
  filename: string;
}

export interface UseDesignCanvasReturn {
  canvas: Canvas | null;
  zoom: number;
  fitZoom: number;
  addText: (text?: string) => void;
  addImage: (url: string) => Promise<void>;
  addShape: (type: 'rect' | 'circle' | 'ellipse') => void;
  deleteSelected: () => void;
  selectAll: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  toJSON: () => Record<string, unknown>;
  loadFromJSON: (json: Record<string, unknown> | string) => Promise<void>;
  exportPNG: () => string;
  exportSVG: () => string;
  exportPrintReady: (options?: { dpi?: number; includeBleed?: boolean; format?: 'png' | 'svg' }) => PrintReadyExport;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useDesignCanvas(options: UseDesignCanvasOptions): UseDesignCanvasReturn {
  const { canvasRef, containerRef, width, height, shape, onModified } = options;

  const fabricRef = useRef<Canvas | null>(null);
  const [canvasReady, setCanvasReady] = useState<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const fitZoomRef = useRef(1);
  const [fitZoom, setFitZoom] = useState(1);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  // Snap guide lines stored on canvas (rendered/removed dynamically)
  const snapLinesRef = useRef<FabricObject[]>([]);

  /* ---------------------------------------------------------------- */
  /*  Calculate fit zoom                                               */
  /* ---------------------------------------------------------------- */
  const calcFitZoom = useCallback((): number => {
    const container = containerRef.current;
    if (!container) return 0.5;
    const rect = container.getBoundingClientRect();
    const availW = rect.width - 80;
    const availH = rect.height - 80;
    const fit = Math.min(availW / width, availH / height, 1);
    return Math.max(fit, MIN_ZOOM);
  }, [containerRef, width, height]);

  /* ---------------------------------------------------------------- */
  /*  Apply fit zoom (center the canvas in the viewport)               */
  /* ---------------------------------------------------------------- */
  const applyFitZoom = useCallback((fc: Canvas, zoomLevel: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Set zoom
    fc.setZoom(zoomLevel);

    // Center the canvas in the container
    const scaledW = width * zoomLevel;
    const scaledH = height * zoomLevel;
    const panX = (rect.width - scaledW) / 2;
    const panY = (rect.height - scaledH) / 2;

    const vpt = fc.viewportTransform;
    vpt[4] = panX;
    vpt[5] = panY;
    fc.setViewportTransform(vpt);
    fc.requestRenderAll();
    setZoom(zoomLevel);
  }, [containerRef, width, height]);

  /* ---------------------------------------------------------------- */
  /*  Initialize / dispose canvas                                      */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const container = containerRef.current;
    if (!canvasEl || !container) return;

    const containerRect = container.getBoundingClientRect();

    const fc = new Canvas(canvasEl, {
      width: containerRect.width,
      height: containerRect.height,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
    });

    // Draw white canvas area using the clip-path shape
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

    // Add a white background rect that represents the sign
    const bgRect = new Rect({
      left: 0,
      top: 0,
      width,
      height,
      fill: '#ffffff',
      selectable: false,
      evented: false,
      excludeFromExport: false,
    });
    (bgRect as FabricObject & { _isBgRect?: boolean })._isBgRect = true;
    fc.add(bgRect);
    fc.sendObjectToBack(bgRect);

    // Calculate initial fit zoom and apply
    const initialFit = Math.min(
      (containerRect.width - 80) / width,
      (containerRect.height - 80) / height,
      1,
    );
    const clampedFit = Math.max(initialFit, MIN_ZOOM);
    fitZoomRef.current = clampedFit;
    setFitZoom(clampedFit);

    // Apply the fit zoom with centering
    fc.setZoom(clampedFit);
    const scaledW = width * clampedFit;
    const scaledH = height * clampedFit;
    const panX = (containerRect.width - scaledW) / 2;
    const panY = (containerRect.height - scaledH) / 2;
    const vpt = fc.viewportTransform;
    vpt[4] = panX;
    vpt[5] = panY;
    fc.setViewportTransform(vpt);
    setZoom(clampedFit);

    // Improve object controls visibility
    const controlStyle = {
      cornerColor: '#ffffff',
      cornerStrokeColor: '#d97706',
      cornerSize: 10,
      cornerStyle: 'circle' as const,
      transparentCorners: false,
      borderColor: '#d97706',
      borderScaleFactor: 2,
      padding: 4,
    };
    fc.getObjects().forEach((obj) => obj.set(controlStyle));

    // Default control styles for new objects
    (Canvas as unknown as { prototype: Record<string, unknown> }).prototype &&
      (() => {
        const origAdd = fc.add.bind(fc);
        fc.add = (...objects: FabricObject[]) => {
          objects.forEach((obj) => {
            if (!(obj as FabricObject & { _isBgRect?: boolean })._isBgRect) {
              obj.set(controlStyle);
            }
          });
          return origAdd(...objects);
        };
      })();

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

  /* ---------------------------------------------------------------- */
  /*  Mouse wheel zoom (centered on pointer)                           */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const handleWheel = (opt: TPointerEventInfo<WheelEvent>) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      const delta = -e.deltaY;
      let newZoom = fc.getZoom() * (1 + delta * ZOOM_SENSITIVITY);
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      // Zoom to the mouse pointer position
      const pointer = fc.getScenePoint(e);
      fc.zoomToPoint(new Point(pointer.x, pointer.y), newZoom);
      fc.requestRenderAll();
      setZoom(newZoom);
    };

    fc.on('mouse:wheel', handleWheel as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
    return () => {
      fc.off('mouse:wheel', handleWheel as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
    };
  }, [canvasReady]);

  /* ---------------------------------------------------------------- */
  /*  Alt+drag / middle-click pan                                      */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const onMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
      const e = opt.e as MouseEvent;
      // Alt+left click or middle mouse button
      if (e.altKey || e.button === 1) {
        isPanningRef.current = true;
        lastPanPointRef.current = { x: e.clientX, y: e.clientY };
        fc.selection = false;
        fc.setCursor('grab');
        // Prevent middle-click paste on some browsers
        e.preventDefault();
      }
    };

    const onMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
      if (!isPanningRef.current || !lastPanPointRef.current) return;
      const e = opt.e as MouseEvent;
      const vpt = fc.viewportTransform;
      vpt[4] += e.clientX - lastPanPointRef.current.x;
      vpt[5] += e.clientY - lastPanPointRef.current.y;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      fc.setViewportTransform(vpt);
      fc.setCursor('grabbing');
    };

    const onMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
        fc.selection = true;
        fc.setCursor('default');
      }
    };

    fc.on('mouse:down', onMouseDown as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
    fc.on('mouse:move', onMouseMove as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
    fc.on('mouse:up', onMouseUp as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);

    return () => {
      fc.off('mouse:down', onMouseDown as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
      fc.off('mouse:move', onMouseMove as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
      fc.off('mouse:up', onMouseUp as unknown as (e: TPointerEventInfo<TPointerEvent>) => void);
    };
  }, [canvasReady]);

  /* ---------------------------------------------------------------- */
  /*  Snap guides                                                      */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const clearGuides = () => {
      snapLinesRef.current.forEach((l) => fc.remove(l));
      snapLinesRef.current = [];
    };

    const addGuideLine = (x1: number, y1: number, x2: number, y2: number) => {
      const line = new Line([x1, y1, x2, y2], {
        stroke: '#d97706',
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.8,
      });
      (line as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide = true;
      fc.add(line);
      snapLinesRef.current.push(line);
    };

    const onObjectMoving = (e: { target: FabricObject }) => {
      const obj = e.target;
      if (!obj) return;

      clearGuides();

      const objCenterX = (obj.left ?? 0) + ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2;
      const objCenterY = (obj.top ?? 0) + ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2;
      const objLeft = obj.left ?? 0;
      const objTop = obj.top ?? 0;
      const objRight = objLeft + (obj.width ?? 0) * (obj.scaleX ?? 1);
      const objBottom = objTop + (obj.height ?? 0) * (obj.scaleY ?? 1);

      const canvasCenterX = width / 2;
      const canvasCenterY = height / 2;

      // Snap to canvas center - horizontal
      if (Math.abs(objCenterX - canvasCenterX) < SNAP_THRESHOLD) {
        obj.set('left', canvasCenterX - ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2);
        addGuideLine(canvasCenterX, 0, canvasCenterX, height);
      }

      // Snap to canvas center - vertical
      if (Math.abs(objCenterY - canvasCenterY) < SNAP_THRESHOLD) {
        obj.set('top', canvasCenterY - ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2);
        addGuideLine(0, canvasCenterY, width, canvasCenterY);
      }

      // Snap to edges (safe area margin)
      if (Math.abs(objLeft - EDGE_SNAP_MARGIN) < SNAP_THRESHOLD) {
        obj.set('left', EDGE_SNAP_MARGIN);
        addGuideLine(EDGE_SNAP_MARGIN, 0, EDGE_SNAP_MARGIN, height);
      }
      if (Math.abs(objTop - EDGE_SNAP_MARGIN) < SNAP_THRESHOLD) {
        obj.set('top', EDGE_SNAP_MARGIN);
        addGuideLine(0, EDGE_SNAP_MARGIN, width, EDGE_SNAP_MARGIN);
      }
      if (Math.abs(objRight - (width - EDGE_SNAP_MARGIN)) < SNAP_THRESHOLD) {
        obj.set('left', width - EDGE_SNAP_MARGIN - (obj.width ?? 0) * (obj.scaleX ?? 1));
        addGuideLine(width - EDGE_SNAP_MARGIN, 0, width - EDGE_SNAP_MARGIN, height);
      }
      if (Math.abs(objBottom - (height - EDGE_SNAP_MARGIN)) < SNAP_THRESHOLD) {
        obj.set('top', height - EDGE_SNAP_MARGIN - (obj.height ?? 0) * (obj.scaleY ?? 1));
        addGuideLine(0, height - EDGE_SNAP_MARGIN, width, height - EDGE_SNAP_MARGIN);
      }
    };

    const onObjectModified = () => {
      clearGuides();
    };

    fc.on('object:moving', onObjectMoving as unknown as (e: { target: FabricObject }) => void);
    fc.on('object:modified', onObjectModified);
    fc.on('selection:cleared', clearGuides);

    return () => {
      fc.off('object:moving', onObjectMoving as unknown as (e: { target: FabricObject }) => void);
      fc.off('object:modified', onObjectModified);
      fc.off('selection:cleared', clearGuides);
      clearGuides();
    };
  }, [canvasReady, width, height]);

  /* ---------------------------------------------------------------- */
  /*  ResizeObserver — recalc fit zoom on container resize              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const fc = fabricRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: cw, height: ch } = entry.contentRect;
        // Resize the canvas element to fill the container
        fc.setDimensions({ width: cw, height: ch });

        // Recalculate fit zoom
        const newFit = Math.min((cw - 80) / width, (ch - 80) / height, 1);
        const clampedFit = Math.max(newFit, MIN_ZOOM);
        fitZoomRef.current = clampedFit;
        setFitZoom(clampedFit);

        // Re-center if current zoom is at fit level
        const currentZoom = fc.getZoom();
        if (Math.abs(currentZoom - fitZoomRef.current) < 0.05) {
          applyFitZoom(fc, clampedFit);
        } else {
          // Just re-render at current zoom, recenter
          const scaledW = width * currentZoom;
          const scaledH = height * currentZoom;
          const panX = (cw - scaledW) / 2;
          const panY = (ch - scaledH) / 2;
          const vpt = fc.viewportTransform;
          vpt[4] = panX;
          vpt[5] = panY;
          fc.setViewportTransform(vpt);
          fc.requestRenderAll();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasReady, width, height, containerRef, applyFitZoom]);

  /* ---------------------------------------------------------------- */
  /*  Wire up onModified callback                                      */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  addText                                                          */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  addImage — auto-scale, center, select                            */
  /* ---------------------------------------------------------------- */
  const addImage = useCallback(async (url: string) => {
    const fc = fabricRef.current;
    if (!fc) return;

    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });

      const imgW = img.width ?? 1;
      const imgH = img.height ?? 1;

      // Smart scaling: fit within 80% of canvas but don't upscale beyond 100%
      const maxW = width * 0.8;
      const maxH = height * 0.8;
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

  /* ---------------------------------------------------------------- */
  /*  addShape                                                         */
  /* ---------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------- */
  /*  deleteSelected                                                   */
  /* ---------------------------------------------------------------- */
  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const active = fc.getActiveObject();
    if (!active) return;

    if (active instanceof ActiveSelection) {
      const objects = active.getObjects();
      fc.discardActiveObject();
      objects.forEach((obj) => {
        if (!(obj as FabricObject & { _isBgRect?: boolean })._isBgRect) {
          fc.remove(obj);
        }
      });
    } else {
      if (!(active as FabricObject & { _isBgRect?: boolean })._isBgRect) {
        fc.remove(active);
      }
    }

    fc.requestRenderAll();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  selectAll                                                        */
  /* ---------------------------------------------------------------- */
  const selectAll = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const objects = fc.getObjects().filter(
      (obj) => !(obj as FabricObject & { _isBgRect?: boolean })._isBgRect &&
               !(obj as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide
    );
    if (objects.length === 0) return;

    fc.discardActiveObject();
    const sel = new ActiveSelection(objects, { canvas: fc });
    fc.setActiveObject(sel);
    fc.requestRenderAll();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Zoom helpers                                                     */
  /* ---------------------------------------------------------------- */
  const zoomIn = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.min(fc.getZoom() * 1.2, MAX_ZOOM);
    const center = new Point(width / 2, height / 2);
    fc.zoomToPoint(center, next);
    fc.requestRenderAll();
    setZoom(next);
  }, [width, height]);

  const zoomOut = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.max(fc.getZoom() / 1.2, MIN_ZOOM);
    const center = new Point(width / 2, height / 2);
    fc.zoomToPoint(center, next);
    fc.requestRenderAll();
    setZoom(next);
  }, [width, height]);

  const resetZoom = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    applyFitZoom(fc, fitZoomRef.current);
  }, [applyFitZoom]);

  const fitToScreen = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const newFit = calcFitZoom();
    fitZoomRef.current = newFit;
    setFitZoom(newFit);
    applyFitZoom(fc, newFit);
  }, [calcFitZoom, applyFitZoom]);

  /* ---------------------------------------------------------------- */
  /*  Serialization                                                    */
  /* ---------------------------------------------------------------- */
  const toJSON = useCallback((): Record<string, unknown> => {
    const fc = fabricRef.current;
    if (!fc) return {};

    // Temporarily remove snap guides and bg rect markers for clean export
    const json = fc.toJSON() as Record<string, unknown>;
    const objects = json.objects as Record<string, unknown>[] | undefined;
    if (objects) {
      json.objects = objects.filter(
        (obj) => !(obj as Record<string, unknown>)._isSnapGuide
      );
    }
    return json;
  }, []);

  const loadFromJSON = useCallback(async (json: Record<string, unknown> | string) => {
    const fc = fabricRef.current;
    if (!fc) return;

    const data = typeof json === 'string' ? JSON.parse(json) as Record<string, unknown> : json;
    const objects = data.objects as Record<string, unknown>[] | undefined;
    if (!objects || objects.length === 0) return;

    // Remove all objects except background rect
    const toRemove = fc.getObjects().filter(
      (obj) => !(obj as FabricObject & { _isBgRect?: boolean })._isBgRect
    );
    toRemove.forEach((obj) => fc.remove(obj));

    // Calculate scale factor if template was designed for different dimensions
    const tplWidth = (data.width as number) || width;
    const tplHeight = (data.height as number) || height;
    const scaleX = width / tplWidth;
    const scaleY = height / tplHeight;
    const scale = Math.min(scaleX, scaleY);

    // Update bg rect color if template has one
    const bgRect = fc.getObjects().find(
      (obj) => (obj as FabricObject & { _isBgRect?: boolean })._isBgRect
    );
    if (bgRect && data.background && typeof data.background === 'string') {
      bgRect.set('fill', data.background);
    }

    try {
      const enlivened = await util.enlivenObjects(objects) as FabricObject[];
      for (const obj of enlivened) {
        if (!obj || typeof obj.set !== 'function') continue;
        // Skip _isBgRect objects from templates
        if ((obj as FabricObject & { _isBgRect?: boolean })._isBgRect) continue;
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
  }, [width, height]);

  /* ---------------------------------------------------------------- */
  /*  Export                                                            */
  /* ---------------------------------------------------------------- */
  const exportPNG = useCallback((): string => {
    const fc = fabricRef.current;
    if (!fc) return '';

    // Save current viewport state
    const currentVPT = [...fc.viewportTransform] as [number, number, number, number, number, number];
    const currentZoom = fc.getZoom();
    const currentWidth = fc.width;
    const currentHeight = fc.height;

    // Remove snap guides
    const guides = fc.getObjects().filter(
      (obj) => (obj as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide
    );
    guides.forEach((g) => fc.remove(g));

    // Reset to 1:1 for export
    fc.setDimensions({ width, height });
    fc.setZoom(1);
    fc.viewportTransform = [1, 0, 0, 1, 0, 0];
    fc.requestRenderAll();

    const dataUrl = fc.toDataURL({ format: 'png', multiplier: 2 });

    // Restore viewport
    fc.setDimensions({ width: currentWidth!, height: currentHeight! });
    fc.setZoom(currentZoom);
    fc.viewportTransform = currentVPT;

    // Re-add guides
    guides.forEach((g) => fc.add(g));
    fc.requestRenderAll();

    return dataUrl;
  }, [width, height]);

  const exportSVG = useCallback((): string => {
    const fc = fabricRef.current;
    if (!fc) return '';

    // Save and reset viewport for export
    const currentVPT = [...fc.viewportTransform] as [number, number, number, number, number, number];
    const currentZoom = fc.getZoom();
    const currentWidth = fc.width;
    const currentHeight = fc.height;

    // Remove snap guides
    const guides = fc.getObjects().filter(
      (obj) => (obj as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide
    );
    guides.forEach((g) => fc.remove(g));

    fc.setDimensions({ width, height });
    fc.setZoom(1);
    fc.viewportTransform = [1, 0, 0, 1, 0, 0];
    fc.requestRenderAll();

    const svg = fc.toSVG();

    // Restore
    fc.setDimensions({ width: currentWidth!, height: currentHeight! });
    fc.setZoom(currentZoom);
    fc.viewportTransform = currentVPT;
    guides.forEach((g) => fc.add(g));
    fc.requestRenderAll();

    return svg;
  }, [width, height]);

  /* ---------------------------------------------------------------- */
  /*  Print-ready export (300 DPI with bleed and trim marks)           */
  /* ---------------------------------------------------------------- */
  const exportPrintReady = useCallback((options?: {
    dpi?: number;
    includeBleed?: boolean;
    format?: 'png' | 'svg';
  }): PrintReadyExport => {
    const fc = fabricRef.current;
    if (!fc) return { dataUrl: '', widthPx: 0, heightPx: 0, dpi: 300, includesBleed: false, filename: 'design.png' };

    const dpi = options?.dpi ?? 300;
    const includeBleed = options?.includeBleed ?? true;
    const format = options?.format ?? 'png';

    // Calculate print multiplier: 300 DPI / 72 DPI (our canvas PPI) ≈ 4.17x
    const multiplier = dpi / 72;

    // Calculate canvas dimensions with optional bleed
    const bleedInches = includeBleed ? 0.125 : 0;
    const bleedPx = Math.round(bleedInches * 72); // bleed in canvas pixels
    const exportWidth = width + (bleedPx * 2);
    const exportHeight = height + (bleedPx * 2);

    // Save current state
    const currentVPT = [...fc.viewportTransform] as [number, number, number, number, number, number];
    const currentZoom = fc.getZoom();
    const currentWidth = fc.width;
    const currentHeight = fc.height;

    // Remove snap guides
    const guides = fc.getObjects().filter(
      (obj) => (obj as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide
    );
    guides.forEach((g) => fc.remove(g));

    // Set canvas to export dimensions (including bleed area)
    fc.setDimensions({ width: exportWidth, height: exportHeight });
    fc.setZoom(1);

    // Offset viewport to show bleed area (shift content so bleed is visible)
    if (includeBleed) {
      fc.viewportTransform = [1, 0, 0, 1, bleedPx, bleedPx];
    } else {
      fc.viewportTransform = [1, 0, 0, 1, 0, 0];
    }
    fc.requestRenderAll();

    let dataUrl: string;
    let filename: string;

    if (format === 'svg') {
      const svgContent = fc.toSVG();
      dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
      filename = `design-print-ready-${dpi}dpi.svg`;
    } else {
      // PNG at print resolution
      dataUrl = fc.toDataURL({
        format: 'png',
        multiplier,
        quality: 1,
      });
      filename = `design-print-ready-${dpi}dpi${includeBleed ? '-with-bleed' : ''}.png`;
    }

    // Restore viewport
    fc.setDimensions({ width: currentWidth!, height: currentHeight! });
    fc.setZoom(currentZoom);
    fc.viewportTransform = currentVPT;
    guides.forEach((g) => fc.add(g));
    fc.requestRenderAll();

    return {
      dataUrl,
      widthPx: Math.round(exportWidth * multiplier),
      heightPx: Math.round(exportHeight * multiplier),
      dpi,
      includesBleed: includeBleed,
      filename,
    };
  }, [width, height]);

  return {
    canvas: canvasReady,
    zoom,
    fitZoom,
    addText,
    addImage,
    addShape,
    deleteSelected,
    selectAll,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    toJSON,
    loadFromJSON,
    exportPNG,
    exportSVG,
    exportPrintReady,
  };
}
