'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Canvas,
  Textbox,
  type FabricObject,
} from 'fabric';
import type { ProductShape } from '@/types/product';
import type { DesignExportFormat } from '@/types/design';
import { useDesignCanvas } from '@/hooks/useDesignCanvas';
import { useDesignHistory } from '@/hooks/useDesignHistory';
import { inchesToPixels } from '@/lib/design/bleed';
import DesignToolbar from './DesignToolbar';
import DesignSidebar from './DesignSidebar';
import DesignProperties, { type ObjectProperties } from './DesignProperties';
import { toast } from 'sonner';

interface DesignEditorProps {
  productId: string;
  productName: string;
  shape: ProductShape;
  width: number;
  height: number;
  displaySize: string;
}

export default function DesignEditor({
  productId,
  productName,
  shape,
  width: widthInches,
  height: heightInches,
}: DesignEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const widthPx = inchesToPixels(widthInches);
  const heightPx = inchesToPixels(heightInches);

  /* ---- Canvas hook (all Fabric.js operations) ---- */
  const {
    canvas,
    addText,
    addImage,
    addShape,
    deleteSelected,
    zoomIn,
    zoomOut,
    toJSON,
    loadFromJSON,
    exportPNG,
    exportSVG,
  } = useDesignCanvas({
    canvasRef: canvasElRef,
    width: widthPx,
    height: heightPx,
    shape,
    onModified: () => saveState(),
  });

  /* ---- History ---- */
  const { canUndo, canRedo, undo, redo, saveState } = useDesignHistory(canvas);

  /* ---- UI state ---- */
  const [showBleed, setShowBleed] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState<ObjectProperties | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ---- Listen to canvas selection events ---- */
  useEffect(() => {
    if (!canvas) return;

    function extractProps(obj: FabricObject): ObjectProperties {
      const isText = obj instanceof Textbox;
      return {
        id: (obj as FabricObject & { id?: string }).id || '',
        type: isText ? 'text' : 'image',
        x: Math.round(obj.left ?? 0),
        y: Math.round(obj.top ?? 0),
        width: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
        height: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
        rotation: Math.round(obj.angle ?? 0),
        opacity: Math.round((obj.opacity ?? 1) * 100),
        ...(isText ? {
          fontFamily: (obj as Textbox).fontFamily || 'Arial',
          fontSize: (obj as Textbox).fontSize || 32,
          fontColor: (typeof (obj as Textbox).fill === 'string' ? (obj as Textbox).fill : '#000000') as string,
          bold: (obj as Textbox).fontWeight === 'bold',
          italic: (obj as Textbox).fontStyle === 'italic',
          underline: !!(obj as Textbox).underline,
          textAlign: ((obj as Textbox).textAlign || 'left') as 'left' | 'center' | 'right',
        } : {}),
      };
    }

    const onSelected = () => {
      const active = canvas.getActiveObject();
      if (active && !(active as unknown as { _objects?: unknown[] })._objects) {
        setSelectedObject(extractProps(active));
      } else {
        setSelectedObject(null);
      }
    };

    const onDeselected = () => setSelectedObject(null);
    const onModified = () => {
      const active = canvas.getActiveObject();
      if (active) setSelectedObject(extractProps(active));
    };

    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('selection:cleared', onDeselected);
    canvas.on('object:modified', onModified);
    canvas.on('object:scaling', onModified);
    canvas.on('object:moving', onModified);
    canvas.on('object:rotating', onModified);

    // Track zoom
    const onZoom = () => setZoom(canvas.getZoom());
    canvas.on('after:render', onZoom);

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      canvas.off('selection:created', onSelected);
      canvas.off('selection:updated', onSelected);
      canvas.off('selection:cleared', onDeselected);
      canvas.off('object:modified', onModified);
      canvas.off('object:scaling', onModified);
      canvas.off('object:moving', onModified);
      canvas.off('object:rotating', onModified);
      canvas.off('after:render', onZoom);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canvas, deleteSelected, undo, redo]);

  /* ---- Toolbar handlers ---- */
  const handleZoomIn = useCallback(() => { zoomIn(); }, [zoomIn]);
  const handleZoomOut = useCallback(() => { zoomOut(); }, [zoomOut]);

  const handlePreview = useCallback(() => {
    const dataUrl = exportPNG();
    if (!dataUrl) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="max-width:100%;background:#f5f5f5" />`);
    }
  }, [exportPNG]);

  const handleSave = useCallback(async () => {
    const json = toJSON();
    const thumbnailDataUrl = exportPNG();
    try {
      const res = await fetch('/api/design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          productId,
          shape,
          width: widthInches,
          height: heightInches,
          canvasJson: JSON.stringify(json),
          thumbnailDataUrl,
        }),
      });
      if (res.ok) {
        toast.success('Design saved!');
      } else {
        toast.error('Failed to save design');
      }
    } catch {
      // Save locally as fallback
      localStorage.setItem(`design-${productId}`, JSON.stringify(json));
      toast.success('Design saved locally');
    }
  }, [toJSON, exportPNG, productId, shape, widthInches, heightInches]);

  const handleExport = useCallback((format: DesignExportFormat) => {
    let data: string;
    let filename: string;
    let mimeType: string;

    if (format === 'png') {
      data = exportPNG();
      filename = `${productId}-design.png`;
      mimeType = 'image/png';
    } else if (format === 'svg') {
      data = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(exportSVG());
      filename = `${productId}-design.svg`;
      mimeType = 'image/svg+xml';
    } else {
      toast.info('PDF export coming soon');
      return;
    }

    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported as ${format.toUpperCase()}`);
  }, [exportPNG, exportSVG, productId]);

  const handleAddToCart = useCallback(() => {
    toast.info('Save your design first, then add the product to cart from the product page.');
  }, []);

  /* ---- Sidebar handlers ---- */
  const handleAddText = useCallback((preset: 'heading' | 'subheading' | 'body') => {
    const sizes = { heading: 'YOUR HEADLINE', subheading: 'Subheading text', body: 'Body text goes here' };
    addText(sizes[preset]);
    saveState();
  }, [addText, saveState]);

  const handleAddImage = useCallback(async (url: string) => {
    await addImage(url);
    saveState();
  }, [addImage, saveState]);

  const handleAddShape = useCallback((type: string) => {
    const shapeMap: Record<string, 'rect' | 'circle' | 'ellipse'> = {
      rectangle: 'rect',
      circle: 'circle',
      triangle: 'rect',
      star: 'circle',
      line: 'rect',
      arrow: 'rect',
    };
    addShape(shapeMap[type] || 'rect');
    saveState();
  }, [addShape, saveState]);

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    try {
      const res = await fetch(`/api/design/templates/${templateId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.canvasJson) {
        const json = typeof data.canvasJson === 'string' ? JSON.parse(data.canvasJson) : data.canvasJson;
        await loadFromJSON(json);
        saveState();
        toast.success('Template applied!');
      }
    } catch {
      toast.error('Failed to load template');
    }
  }, [loadFromJSON, saveState]);

  const handleDownloadTemplate = useCallback(() => {
    toast.info('Artwork templates coming soon — contact us for files.');
  }, []);

  /* ---- Properties handlers ---- */
  const handleUpdateProperty = useCallback((property: string, value: number | string | boolean) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const propMap: Record<string, string> = {
      x: 'left', y: 'top', rotation: 'angle',
      fontFamily: 'fontFamily', fontSize: 'fontSize', fontColor: 'fill',
      textAlign: 'textAlign',
    };

    if (property === 'opacity') {
      active.set('opacity', (value as number) / 100);
    } else if (property === 'width') {
      const currentW = (active.width ?? 1) * (active.scaleX ?? 1);
      if (currentW > 0) active.set('scaleX', (value as number) / (active.width ?? 1));
    } else if (property === 'height') {
      const currentH = (active.height ?? 1) * (active.scaleY ?? 1);
      if (currentH > 0) active.set('scaleY', (value as number) / (active.height ?? 1));
    } else if (property === 'bold') {
      (active as Textbox).set('fontWeight', value ? 'bold' : 'normal');
    } else if (property === 'italic') {
      (active as Textbox).set('fontStyle', value ? 'italic' : 'normal');
    } else if (property === 'underline') {
      (active as Textbox).set('underline', !!value);
    } else {
      const fabricProp = propMap[property] || property;
      active.set(fabricProp as keyof FabricObject, value);
    }

    canvas.requestRenderAll();
    saveState();

    // Update local state
    setSelectedObject(prev => prev ? { ...prev, [property]: value } : null);
  }, [canvas, saveState]);

  const handleDeleteObject = useCallback(() => {
    deleteSelected();
    setSelectedObject(null);
    saveState();
  }, [deleteSelected, saveState]);

  /* ---- Auto-load saved design ---- */
  useEffect(() => {
    if (!canvas) return;
    const saved = localStorage.getItem(`design-${productId}`);
    if (saved) {
      try {
        loadFromJSON(JSON.parse(saved)).then(() => saveState());
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, productId]);

  /* ---- Canvas display ---- */
  const aspectRatio = widthInches / heightInches;
  const canvasDisplayWidth = isMobile ? 320 : 600;
  const canvasDisplayHeight = canvasDisplayWidth / aspectRatio;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950">
      {/* Top toolbar */}
      <DesignToolbar
        productName={productName}
        zoom={zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        showBleed={showBleed}
        showSafeArea={showSafeArea}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleBleed={() => setShowBleed(b => !b)}
        onToggleSafeArea={() => setShowSafeArea(b => !b)}
        onPreview={handlePreview}
        onSave={handleSave}
        onExport={handleExport}
        onAddToCart={handleAddToCart}
      />

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar (desktop only) */}
        {!isMobile && (
          <DesignSidebar
            shape={shape}
            onAddText={handleAddText}
            onAddImage={handleAddImage}
            onAddShape={handleAddShape}
            onApplyTemplate={handleApplyTemplate}
            onDownloadTemplate={handleDownloadTemplate}
            isMobile={false}
          />
        )}

        {/* Center canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center overflow-hidden bg-gray-900/50"
        >
          {/* Canvas container — just the Fabric.js canvas, no extra borders */}
          <div className="relative" style={{ width: canvasDisplayWidth, height: canvasDisplayHeight, maxWidth: '90%', maxHeight: '85%' }}>
            <canvas ref={canvasElRef} id="design-canvas" />
          </div>

          {/* Guide labels (small text in corner) */}
          {(showBleed || showSafeArea) && (
            <div className="absolute top-2 left-2 flex gap-3 pointer-events-none">
              {showBleed && (
                <span className="text-[10px] text-red-400/70 flex items-center gap-1">
                  <span className="w-3 h-0 border-t border-dashed border-red-400/70 inline-block" /> bleed
                </span>
              )}
              {showSafeArea && (
                <span className="text-[10px] text-green-400/70 flex items-center gap-1">
                  <span className="w-3 h-0 border-t border-dashed border-green-400/70 inline-block" /> safe area
                </span>
              )}
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-gray-900/90 rounded-lg px-1 py-0.5">
            <button onClick={handleZoomOut} className="text-gray-400 hover:text-white text-xs px-2 py-1 transition-colors">−</button>
            <span className="text-gray-400 text-xs font-mono min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="text-gray-400 hover:text-white text-xs px-2 py-1 transition-colors">+</button>
          </div>

          {/* Hint when canvas is empty */}
          {canvas && canvas.getObjects().length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-gray-500 text-lg font-medium">Start designing</p>
                <p className="text-gray-600 text-sm mt-1">Add text, upload images, or pick a template</p>
              </div>
            </div>
          )}
        </div>

        {/* Right properties panel */}
        {!isMobile && (
          <DesignProperties
            selectedObject={selectedObject}
            onUpdateProperty={handleUpdateProperty}
            onDelete={handleDeleteObject}
          />
        )}
      </div>

      {/* Mobile bottom bar */}
      {isMobile && (
        <DesignSidebar
          shape={shape}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
          onAddShape={handleAddShape}
          onApplyTemplate={handleApplyTemplate}
          onDownloadTemplate={handleDownloadTemplate}
          isMobile
        />
      )}
    </div>
  );
}

/* ---- Session ID helper ---- */
function getSessionId(): string {
  const key = 'ctt-design-session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
