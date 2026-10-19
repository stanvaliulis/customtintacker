'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Canvas,
  Rect,
  Circle,
  Ellipse,
  Path,
  Line,
  Polygon,
  Textbox,
  FabricImage,
  ActiveSelection,
  FabricObject,
  type TPointerEventInfo,
  type TPointerEvent,
  util,
  Point,
} from 'fabric';
import type { ProductShape } from '@/types/product';
import { getShapeDefinition } from '@/lib/design/shapes';
import { fitTemplate, validateCanvas } from '@/lib/design/document';
import { restoringCanvases } from '@/lib/design/canvas-transaction';
import { ensureProofIds, readProofIntent, PROOF_PROPERTIES } from '@/lib/design/proof-intent';
FabricObject.customProperties = Array.from(new Set([...FabricObject.customProperties, ...PROOF_PROPERTIES]));
import { BLEED_INCHES, SAFE_AREA_INCHES, PPI } from '@/lib/design/bleed';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_SENSITIVITY = 0.001;
const SNAP_THRESHOLD = 8; // px distance to trigger snapping
const EDGE_SNAP_MARGIN = 10; // px from edges for safe area snap

/** Canvas serialization resolves temporary selection transforms into document coordinates. */
export function serializeCanvasSelection(canvas: Pick<Canvas, 'getActiveObjects' | 'getObjects' | 'toObject'>): string {
  ensureProofIds(canvas.getObjects().filter(o => o.selectable && !o.excludeFromExport));
  const selected = new Set(canvas.getActiveObjects());
  const visible = canvas.getObjects().filter(o => !o.excludeFromExport);
  const exported = canvas.toObject() as { objects: Record<string, unknown>[] };
  return JSON.stringify(exported.objects.filter((_, index) => selected.has(visible[index])));
}

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
  showBleed?: boolean;
  showSafeArea?: boolean;
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
  addText: (text?: string, options?: { fontFamily?: string; fill?: string }) => void;
  addImage: (url: string) => Promise<void>;
  addShape: (type: 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'line' | 'arrow', options?: { fill?: string; stroke?: string }) => void;
  deleteSelected: () => void;
  selectAll: () => void;
  copySelected: () => void;
  pasteFromClipboard: () => Promise<void>;
  duplicateSelected: () => Promise<void>;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
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
  const exportingRef = useRef(false);

  const fabricRef = useRef<Canvas | null>(null);
  const [canvasReady, setCanvasReady] = useState<Canvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const fitZoomRef = useRef(1);
  const [fitZoom, setFitZoom] = useState(1);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  // Snap guide lines stored on canvas (rendered/removed dynamically)
  const snapLinesRef = useRef<FabricObject[]>([]);
  const clipboardRef = useRef<string | null>(null);

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
      {
        const origAdd = fc.add.bind(fc);
        fc.add = (...objects: FabricObject[]) => {
          objects.forEach((obj) => {
            if (!(obj as FabricObject & { _isBgRect?: boolean })._isBgRect) {
              obj.set(controlStyle);
            }
          });
          return origAdd(...objects);
        };
      }

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
      const pointer = fc.getViewportPoint(e);
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
        const previousFit = fitZoomRef.current;
        fitZoomRef.current = clampedFit;
        setFitZoom(clampedFit);

        // Re-center if current zoom is at fit level
        const currentZoom = fc.getZoom();
        if (Math.abs(currentZoom - previousFit) < 0.05) {
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
  const addText = useCallback((text = 'Your Text', options?: { fontFamily?: string; fill?: string }) => {
    const fc = fabricRef.current;
    if (!fc) return;

    const tb = new Textbox(text, {
      left: width / 2 - 100,
      top: height / 2 - 20,
      fontSize: Math.max(24, Math.min(48, width * 0.04)),
      fontFamily: options?.fontFamily ?? 'Arial',
      fill: options?.fill ?? '#000000',
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

      if (fabricRef.current !== fc) { img.dispose(); return; }
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
    } catch {
      throw new Error('This image could not be opened. Try a PNG, JPEG, or WebP file.');
    }
  }, [width, height]);

  /* ---------------------------------------------------------------- */
  /*  addShape                                                         */
  /* ---------------------------------------------------------------- */
  const addShape = useCallback((
    type: 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'line' | 'arrow',
    options?: { fill?: string; stroke?: string },
  ) => {
    const fc = fabricRef.current;
    if (!fc) return;

    let obj: FabricObject;
    const size = Math.min(width, height) * 0.2;
    const baseProps = {
      left: width / 2 - size / 2,
      top: height / 2 - size / 2,
      fill: options?.fill ?? '#d97706',
      stroke: options?.stroke ?? '#92400e',
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
      case 'triangle': {
        const th = size * 0.866;
        obj = new Polygon(
          [{ x: size / 2, y: 0 }, { x: size, y: th }, { x: 0, y: th }],
          { ...baseProps, top: height / 2 - th / 2 },
        );
        break;
      }
      case 'star': {
        const outerR = size / 2;
        const innerR = outerR * 0.4;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (Math.PI / 5) * i - Math.PI / 2;
          pts.push({ x: outerR + r * Math.cos(a), y: outerR + r * Math.sin(a) });
        }
        obj = new Polygon(pts, baseProps);
        break;
      }
      case 'line':
        obj = new Line([0, 0, size, 0], {
          left: width / 2 - size / 2,
          top: height / 2,
          stroke: options?.stroke ?? '#92400e',
          strokeWidth: 3,
          fill: '',
        });
        break;
      case 'arrow': {
        const aw = size;
        const ah = size * 0.6;
        obj = new Polygon(
          [
            { x: 0, y: ah * 0.3 },
            { x: aw * 0.6, y: ah * 0.3 },
            { x: aw * 0.6, y: 0 },
            { x: aw, y: ah * 0.5 },
            { x: aw * 0.6, y: ah },
            { x: aw * 0.6, y: ah * 0.7 },
            { x: 0, y: ah * 0.7 },
          ],
          { ...baseProps, top: height / 2 - ah / 2 },
        );
        break;
      }
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
  /*  Copy / Paste / Duplicate                                         */
  /* ---------------------------------------------------------------- */
  const copySelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    clipboardRef.current = serializeCanvasSelection(fc);
  }, []);

  const insertCopies = useCallback(async (serialized: string) => {
    const fc = fabricRef.current;
    if (!fc || restoringCanvases.has(fc)) return;
    try {
      const objects = await util.enlivenObjects(JSON.parse(serialized)) as FabricObject[];
      if (fabricRef.current !== fc || restoringCanvases.has(fc)) { objects.forEach(o => o.dispose()); return; }
      if (!objects.length) return;
      ensureProofIds(objects, true); // Copies inherit requested intent but get independent identities.
      fc.discardActiveObject();
      for (const obj of objects) { obj.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 }); obj.setCoords(); }
      fc.add(...objects);
      fc.setActiveObject(objects.length === 1 ? objects[0] : new ActiveSelection(objects, { canvas: fc }));
      fc.requestRenderAll();
    } catch { /* ignore */ }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    if (clipboardRef.current) await insertCopies(clipboardRef.current);
  }, [insertCopies]);

  const duplicateSelected = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    await insertCopies(serializeCanvasSelection(fc));
  }, [insertCopies]);

  /* ---------------------------------------------------------------- */
  /*  Layer ordering                                                   */
  /* ---------------------------------------------------------------- */
  const bringToFront = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    fc.bringObjectToFront(active);
    fc.requestRenderAll();
  }, []);

  const sendToBack = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    fc.sendObjectToBack(active);
    const bgRect = fc.getObjects().find(
      (obj) => (obj as FabricObject & { _isBgRect?: boolean })._isBgRect
    );
    if (bgRect) fc.sendObjectToBack(bgRect);
    fc.requestRenderAll();
  }, []);

  const bringForward = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    fc.bringObjectForward(active);
    fc.requestRenderAll();
  }, []);

  const sendBackward = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    fc.sendObjectBackwards(active);
    const bgRect = fc.getObjects().find(
      (obj) => (obj as FabricObject & { _isBgRect?: boolean })._isBgRect
    );
    if (bgRect) fc.sendObjectToBack(bgRect);
    fc.requestRenderAll();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Nudge selected object                                            */
  /* ---------------------------------------------------------------- */
  const nudgeSelected = useCallback((dx: number, dy: number) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active || (active as FabricObject & { _isBgRect?: boolean })._isBgRect) return;
    active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy });
    active.setCoords();
    fc.requestRenderAll();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Zoom helpers                                                     */
  /* ---------------------------------------------------------------- */
  const zoomIn = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.min(fc.getZoom() * 1.2, MAX_ZOOM);
    const center = new Point(fc.width / 2, fc.height / 2);
    fc.zoomToPoint(center, next);
    fc.requestRenderAll();
    setZoom(next);
  }, []);

  const zoomOut = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const next = Math.max(fc.getZoom() / 1.2, MIN_ZOOM);
    const center = new Point(fc.width / 2, fc.height / 2);
    fc.zoomToPoint(center, next);
    fc.requestRenderAll();
    setZoom(next);
  }, []);

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
    if (!fc) return { objects: [], width, height };
    // Exclude canvas furniture explicitly: Fabric does not serialize private markers.
    const bg = fc.getObjects().find(o => (o as FabricObject & { _isBgRect?: boolean })._isBgRect);
    ensureProofIds(fc.getObjects().filter(o => o.selectable && !o.excludeFromExport));
    const exported = fc.toObject() as { objects: Record<string, unknown>[] };
    const visibleObjects = fc.getObjects().filter(o => !o.excludeFromExport);
    return { version: '6.0.0', width, height, proofIntent: readProofIntent(fc), background: bg?.fill || '#ffffff',
      objects: exported.objects.filter((_, index) => visibleObjects[index] !== bg) };
  }, [width, height]);

  const loadFromJSON = useCallback(async (json: Record<string, unknown> | string) => {
    const fc = fabricRef.current;
    if (!fc || restoringCanvases.has(fc)) throw new Error('Please wait for the current design to finish loading.');
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    validateCanvas(data);
    const first = (data.objects as Record<string, unknown>[])[0];
    const legacyBackground = first && String(first.type).toLowerCase() === 'rect' && first.selectable === false && first.evented === false ? first.fill : undefined;
    const fit = fitTemplate(Number(data.width) || width, Number(data.height) || height, width, height);
    // Legacy documents included the noninteractive white background in their objects.
    const objects = (data.objects as Record<string, unknown>[]).filter((o, i) =>
      !(o._isBgRect || o.excludeFromExport || (i === 0 && String(o.type).toLowerCase() === 'rect' && o.selectable === false && o.evented === false)));
    restoringCanvases.add(fc);
    try {
      const enlivened = await util.enlivenObjects(objects) as FabricObject[];
      if (fabricRef.current !== fc) { enlivened.forEach(o => o.dispose()); return; }
      ensureProofIds(enlivened);
      Object.assign(fc, { proofIntent: readProofIntent(data) });
      // Only replace after every object has loaded successfully.
      fc.discardActiveObject();
      fc.remove(...fc.getObjects());
      const bg = new Rect({ left: 0, top: 0, width, height, fill: typeof legacyBackground === 'string' ? legacyBackground : typeof data.background === 'string' ? data.background : '#ffffff', selectable: false, evented: false });
      (bg as FabricObject & { _isBgRect?: boolean })._isBgRect = true;
      fc.add(bg);
      for (const obj of enlivened) {
        obj.set({ left: (obj.left ?? 0) * fit.scale + fit.left, top: (obj.top ?? 0) * fit.scale + fit.top,
          scaleX: (obj.scaleX ?? 1) * fit.scale, scaleY: (obj.scaleY ?? 1) * fit.scale });
        obj.setCoords();
        fc.add(obj);
      }
      fc.requestRenderAll();
    } finally { restoringCanvases.delete(fc); }
  }, [width, height]);

  // Guides are a display overlay only; never serialized, selected, or exported.
  useEffect(() => {
    const fc = canvasReady;
    if (!fc) return;
    const renderGuides = () => {
      if (exportingRef.current) return;
      const ctx = fc.getContext();
      ctx.save();
      ctx.transform(...fc.viewportTransform);
      const draw = (inset: number, color: string) => {
        ctx.save(); ctx.translate(inset, inset);
        ctx.strokeStyle = color; ctx.lineWidth = 1 / fc.getZoom(); ctx.setLineDash([5 / fc.getZoom(), 4 / fc.getZoom()]);
        ctx.stroke(new Path2D(getShapeDefinition(shape).getPath(width - inset * 2, height - inset * 2)));
        ctx.restore();
      };
      if (options.showBleed) draw(-BLEED_INCHES * PPI, '#f87171');
      if (options.showSafeArea) draw(SAFE_AREA_INCHES * PPI, '#4ade80');
      ctx.restore();
    };
    fc.on('after:render', renderGuides); fc.requestRenderAll();
    return () => { fc.off('after:render', renderGuides); };
  }, [canvasReady, shape, width, height, options.showBleed, options.showSafeArea]);

  const renderExport = useCallback((format: 'png' | 'svg', multiplier: number): string => {
    const fc = fabricRef.current;
    if (!fc) return '';
    if (width * height * multiplier * multiplier > 64000000) throw new Error('This raster export is too large for the browser. Download SVG or an editable design instead.');
    const viewport = [...fc.viewportTransform] as [number, number, number, number, number, number];
    const dimensions = { width: fc.width, height: fc.height };
    const guides = fc.getObjects().filter(o => o.excludeFromExport);
    exportingRef.current = true;
    try {
      guides.forEach(o => { o.visible = false; });
      fc.setDimensions({ width, height });
      fc.setViewportTransform([1, 0, 0, 1, 0, 0]);
      fc.renderAll();
      return format === 'svg' ? fc.toSVG() : fc.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
    } finally {
      fc.setDimensions(dimensions); fc.setViewportTransform(viewport);
      guides.forEach(o => { o.visible = true; });
      exportingRef.current = false; fc.requestRenderAll();
    }
  }, [width, height]);
  const exportPNG = useCallback(() => renderExport('png', 1), [renderExport]);
  const exportSVG = useCallback(() => renderExport('svg', 1), [renderExport]);
  const exportPrintReady = useCallback((options?: { dpi?: number; includeBleed?: boolean; format?: 'png' | 'svg' }): PrintReadyExport => {
    const dpi = options?.dpi ?? 300;
    const format = options?.format ?? 'png';
    return { dataUrl: renderExport(format, dpi / PPI), widthPx: Math.round(width * dpi / PPI), heightPx: Math.round(height * dpi / PPI),
      dpi, includesBleed: false, filename: 'design-review.' + format };
  }, [width, height, renderExport]);

  return {
    canvas: canvasReady,
    zoom,
    fitZoom,
    addText,
    addImage,
    addShape,
    deleteSelected,
    selectAll,
    copySelected,
    pasteFromClipboard,
    duplicateSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    nudgeSelected,
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
