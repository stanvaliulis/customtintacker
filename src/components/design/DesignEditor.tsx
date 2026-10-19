'use client';

import { useCart } from '@/context/CartContext';
import { savedAttachment } from '@/lib/design/proof-attachment';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Textbox,
  FabricImage,
  type FabricObject,
} from 'fabric';
import type { ProductShape } from '@/types/product';
import type { DesignExportFormat } from '@/types/design';
import { useDesignCanvas } from '@/hooks/useDesignCanvas';
import { useDesignHistory } from '@/hooks/useDesignHistory';
import { inchesToPixels } from '@/lib/design/bleed';
import DesignToolbar from './DesignToolbar';
import ProofReview, { type ProofSnapshot } from './ProofReview';
import UploadPanel from './panels/UploadPanel';
import { getShapeDefinition } from '@/lib/design/shapes';
import type { ProofLayer } from '@/lib/design/proof';
import { ensureProofIds, readProofIntent, writeProofIntent, type IntentElement, type EmbossPreference } from '@/lib/design/proof-intent';
import DesignSidebar from './DesignSidebar';
import DesignProperties, { type ObjectProperties } from './DesignProperties';
import { toast } from 'sonner';
import { useDesignDraft } from '@/hooks/useDesignDraft';
import { createDocument, parseDocument, MAX_DESIGN_BYTES } from '@/lib/design/document';
import { restoringCanvases } from '@/lib/design/canvas-transaction';
import { canvasForTemplate } from '@/lib/design/template-layout';
import { getTemplateById } from '@/data/design-templates';
import type { DesignTemplateData } from '@/data/design-templates';

/* ------------------------------------------------------------------ */
/*  Checkered background CSS (like Photoshop transparency grid)        */
/* ------------------------------------------------------------------ */
const CHECKER_BG_STYLE: React.CSSProperties = {
  backgroundImage: [
    'linear-gradient(45deg, #2a2a2e 25%, transparent 25%)',
    'linear-gradient(-45deg, #2a2a2e 25%, transparent 25%)',
    'linear-gradient(45deg, transparent 75%, #2a2a2e 75%)',
    'linear-gradient(-45deg, transparent 75%, #2a2a2e 75%)',
  ].join(', '),
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: '#222226',
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DesignEditorProps {
  productId: string;
  productName: string;
  shape: ProductShape;
  width: number;
  height: number;
  displaySize: string;
  guideAvailable?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DesignEditor({
  productId,
  productName,
  shape,
  width: widthInches,
  height: heightInches,
  guideAvailable = true,
}: DesignEditorProps) {
  const cart = useCart();
  const [attaching, setAttaching] = useState(false);
  const [showBleed, setShowBleed] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [applying, setApplying] = useState(false);
  const applyingRef = useRef(false);
  const [showProperties, setShowProperties] = useState(false);
  const [mode, setMode] = useState<'design' | 'team'>('design');
  const [proof, setProof] = useState<ProofSnapshot | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorTop, setEditorTop] = useState(64);
  useEffect(() => {
    const measure = () => { if (editorRef.current) setEditorTop(Math.round(editorRef.current.getBoundingClientRect().top + window.scrollY)); };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(document.body);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const widthPx = inchesToPixels(widthInches);
  const heightPx = inchesToPixels(heightInches);

  /* ---- Canvas hook (all Fabric.js operations) ---- */
  const {
    canvas,
    zoom,
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
    fitToScreen,
    toJSON,
    loadFromJSON,
    exportPNG,
    exportSVG,
    exportPrintReady,
  } = useDesignCanvas({
    canvasRef: canvasElRef,
    containerRef,
    width: widthPx,
    height: heightPx,
    shape,
    showBleed,
    showSafeArea,
  });

  /* ---- History ---- */
  const history = useDesignHistory(canvas, toJSON, loadFromJSON);
  const draft = useDesignDraft(canvas, { id: productId, shape, width: widthInches, height: heightInches }, toJSON, loadFromJSON, history.resetHistory);
  const { canUndo, canRedo, saveState: captureHistory, undo: undoHistory, redo: redoHistory } = history;
  const { ready, persist, saveOnline } = draft;
  const saveState = useCallback(() => {
    if (!canvas || !ready || restoringCanvases.has(canvas)) return;
    captureHistory(); persist();
  }, [canvas, ready, persist, captureHistory]);
  const undo = useCallback(async () => { try { await undoHistory(); persist(); } catch { toast.error('Could not undo. Your current design has been kept.'); } }, [undoHistory, persist]);
  const redo = useCallback(async () => { try { await redoHistory(); persist(); } catch { toast.error('Could not redo. Your current design has been kept.'); } }, [redoHistory, persist]);
  const busy = !ready || applying || history.busy;

  const [selectedObject, setSelectedObject] = useState<ObjectProperties | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [, refreshObjects] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Batch add/remove events into one user action; ignore partial restores and snap guides.
  useEffect(() => {
    if (!canvas || !ready) return;
    let timer: ReturnType<typeof setTimeout>;
    const changed = (event: { target?: FabricObject }) => {
      if (restoringCanvases.has(canvas) || event.target?.excludeFromExport) return;
      clearTimeout(timer);
      timer = setTimeout(() => { saveState(); refreshObjects(n => n + 1); }, 0);
    };
    canvas.on('object:modified', changed); canvas.on('object:added', changed);
    canvas.on('object:removed', changed); canvas.on('text:changed', changed);
    return () => { clearTimeout(timer); canvas.off('object:modified', changed); canvas.off('object:added', changed); canvas.off('object:removed', changed); canvas.off('text:changed', changed); };
  }, [canvas, ready, saveState]);

  /* ---- Listen to canvas selection events ---- */
  useEffect(() => {
    if (!canvas) return;

    function extractProps(obj: FabricObject): ObjectProperties {
      const isText = obj instanceof Textbox;
      const isImage = obj instanceof FabricImage;
      const objType = isText ? 'text' : isImage ? 'image' : 'shape';
      return {
        id: (obj as FabricObject & { id?: string }).id || '',
        type: objType,
        x: Math.round(obj.left ?? 0),
        y: Math.round(obj.top ?? 0),
        width: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
        height: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
        rotation: Math.round(obj.angle ?? 0),
        opacity: Math.round((obj.opacity ?? 1) * 100),
        ...(isText ? {
          text: (obj as Textbox).text,
          fontFamily: (obj as Textbox).fontFamily || 'Arial',
          fontSize: (obj as Textbox).fontSize || 32,
          fontColor: (typeof (obj as Textbox).fill === 'string' ? (obj as Textbox).fill : '#000000') as string,
          bold: (obj as Textbox).fontWeight === 'bold',
          italic: (obj as Textbox).fontStyle === 'italic',
          underline: !!(obj as Textbox).underline,
          textAlign: ((obj as Textbox).textAlign || 'left') as 'left' | 'center' | 'right',
        } : {}),
        ...(!isText && !isImage ? {
          fill: (typeof obj.fill === 'string' ? obj.fill : '#d97706') as string,
          stroke: (typeof obj.stroke === 'string' ? obj.stroke : '#92400e') as string,
        } : {}),
      };
    }

    const onSelected = () => {
      const active = canvas.getActiveObject();
      if (active && !(active as unknown as { _objects?: unknown[] })._objects) {
        // Skip bg rect from selection info
        if ((active as FabricObject & { _isBgRect?: boolean })._isBgRect) {
          setSelectedObject(null);
          return;
        }
        setSelectedObject(extractProps(active));
        if (!isMobile) setShowProperties(true);
      } else {
        setSelectedObject(null);
      }
    };

    const onDeselected = () => setSelectedObject(null);
    const onModified = () => {
      const active = canvas.getActiveObject();
      if (active && !(active as FabricObject & { _isBgRect?: boolean })._isBgRect) {
        setSelectedObject(extractProps(active));
      }
    };

    canvas.on('selection:created', onSelected);
    canvas.on('selection:updated', onSelected);
    canvas.on('selection:cleared', onDeselected);
    canvas.on('object:modified', onModified);
    canvas.on('object:scaling', onModified);
    canvas.on('object:moving', onModified);
    canvas.on('object:rotating', onModified);

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      if (proof || mode !== 'design' || busy || e.target instanceof HTMLElement && e.target.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) return;
      if (canvas.getActiveObject() instanceof Textbox && (canvas.getActiveObject() as Textbox).isEditing) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); deleteSelected(); saveState();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        fitToScreen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copySelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteFromClipboard().then(() => saveState());
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected().then(() => saveState());
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); void redo(); }
      // Arrow key nudging (1px, or 10px with Shift)
      const nudge = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelected(-nudge, 0); saveState(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nudgeSelected(nudge, 0); saveState(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); nudgeSelected(0, -nudge); saveState(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); nudgeSelected(0, nudge); saveState(); }
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
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canvas, deleteSelected, undo, redo, fitToScreen, copySelected, pasteFromClipboard, duplicateSelected, selectAll, nudgeSelected, saveState, busy, proof, mode, isMobile]);

  /* ---- Toolbar handlers ---- */
  const handleZoomIn = useCallback(() => { zoomIn(); }, [zoomIn]);
  const handleZoomOut = useCallback(() => { zoomOut(); }, [zoomOut]);
  const handleFitToScreen = useCallback(() => { fitToScreen(); }, [fitToScreen]);

  const handlePreview = useCallback(async () => {
    if (!canvas || reviewing) return;
    setReviewing(true);
    try {
      const image = exportPNG();
      if (!image) throw new Error('Could not create a preview.');
      const objects = canvas.getObjects().filter(o => o.selectable && !o.excludeFromExport);
      ensureProofIds(objects);
      const layers: ProofLayer[] = await Promise.all(objects.map(async (o, i) => {
        const bounds = o.getBoundingRect();
        const intent = o as typeof o & IntentElement;
        const layer: ProofLayer = { id: intent.proofId, embossRequested: intent.embossRequested === true, label: (o instanceof Textbox ? o.text : o.type).slice(0, 70) || 'Layer ' + (i + 1), type: o.type, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
        if (o instanceof FabricImage) {
          const original = o.getOriginalSize();
          layer.ppi = Math.min(original.width / (o.getScaledWidth() / 72), original.height / (o.getScaledHeight() / 72));
        } else if (['rect','circle','ellipse','triangle','polygon','path','line','textbox','i-text','text'].includes(o.type.toLowerCase())) {
          const clone = await o.clone();
          clone.set({ fill: o.fill ? '#000000' : '', stroke: o.stroke ? '#000000' : null, opacity: 1, shadow: null });
          if (clone instanceof Textbox) clone.set('styles', {});
          layer.maskSvg = clone.toSVG();
          clone.dispose();
        }
        return layer;
      }));
      setProof({ image, layers, preference: readProofIntent(canvas).preference, trimPath: getShapeDefinition(shape).getPath(widthInches * 72, heightInches * 72), source: { productId, shape, width: widthInches, height: heightInches, canvas: toJSON() } });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Preview failed. Your design is unchanged.'); }
    finally { setReviewing(false); }
  }, [canvas, exportPNG, reviewing, shape, widthInches, heightInches, productId, toJSON]);

  const handleSave = useCallback(async () => {
    const id = await saveOnline();
    if (id) toast.success('Design saved online. Check the save status for device backup availability.');
    else toast.error('Online save is incomplete. Download an editable backup to keep your work.');
    return id;
  }, [saveOnline]);
  const download = (data: string, filename: string) => {
    const link = document.createElement('a'); link.href = data; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
  };
  const handleBackup = () => {
    const doc = createDocument({ id: productId, shape, width: widthInches, height: heightInches }, toJSON());
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc)], { type: 'application/json' }));
    download(url, productId + '-editable-design.json'); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const handleOpenFile = async (file?: File) => {
    if (!file || applyingRef.current) return;
    try {
      if (file.size > MAX_DESIGN_BYTES) throw new Error('Choose a design file smaller than 8 MB.');
      const doc = parseDocument(await file.text(), { id: productId, shape, width: widthInches, height: heightInches });
      if (!window.confirm('Replace the current canvas with this saved design? You can undo this change.')) return;
      applyingRef.current = true; setApplying(true);
      await loadFromJSON(doc.canvas); saveState();
      toast.success('Editable design reopened.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not open this design.'); }
    finally { applyingRef.current = false; setApplying(false); if (fileRef.current) fileRef.current.value = ''; }
  };
  const handleExport = useCallback((format: DesignExportFormat) => {
    try {
      if (format === 'svg') download('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(exportSVG()), productId + '-artwork.svg');
      else if (format === 'print-png') download(exportPrintReady({ dpi: 300, includeBleed: false }).dataUrl, productId + '-300dpi-review.png');
      else download(exportPNG(), productId + '-preview.png');
      toast.success('Exported for review. Check your production proof before printing.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Export failed. Try an editable backup.'); }
  }, [exportPNG, exportSVG, exportPrintReady, productId]);
  const handleProofIntent = (preference: EmbossPreference, selectedIds: string[]) => {
    if (!canvas || busy) return;
    writeProofIntent(canvas, canvas.getObjects().filter(o => o.selectable && !o.excludeFromExport), preference, selectedIds);
    saveState();
  };
  const handleAttachProof = async (version: string) => {
    if (attaching || !cart.items.some(i => i.product.id === productId)) return;
    setAttaching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const id = await saveOnline();
      if (!id) throw new Error('Save did not finish. Your cart attachment is unchanged.');
      const response = await fetch('/api/artwork/load/' + encodeURIComponent(id), { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('Could not reopen the saved design. Try again.');
      const record = await response.json();
      if (record.id !== id) throw new Error('Saved design did not match.');
      const attachment = await savedAttachment(record, productId, version);
      cart.attachDesign(productId, attachment);
      toast.success('Exact saved proof attached to your cart. Payment and production approval are still separate.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not attach the proof.'); }
    finally { clearTimeout(timer); setAttaching(false); }
  };
  const handleRequestQuote = async (teamProof = false) => {
    const id = await handleSave();
    if (!id) return;
    window.location.assign('/quote?product=' + encodeURIComponent(productName) + '&shape=' + encodeURIComponent(shape) + '&designId=' + encodeURIComponent(id) + '&size=' + encodeURIComponent(widthInches + 'x' + heightInches) + (teamProof ? '&proof=team' : ''));
  };

  /* ---- Sidebar handlers ---- */
  const handleAddText = useCallback((preset: 'heading' | 'subheading' | 'body', options?: { fontFamily?: string; fill?: string }) => {
    if (busy) return;
    const sizes = { heading: 'YOUR HEADLINE', subheading: 'Subheading text', body: 'Body text goes here' };
    addText(sizes[preset], options);
    saveState();
  }, [addText, saveState, busy]);

  const handleAddImage = useCallback(async (url: string) => {
    if (busy) return;
    await addImage(url);
    saveState();
    setImageHint('Click and drag to reposition your image');
    setTimeout(() => setImageHint(null), 4000);
  }, [addImage, saveState, busy]);

  const handleAddShape = useCallback((type: string, options?: { fill?: string; stroke?: string }) => {
    if (busy) return;
    const typeMap: Record<string, 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'line' | 'arrow'> = {
      rectangle: 'rect',
      circle: 'circle',
      triangle: 'triangle',
      star: 'star',
      line: 'line',
      arrow: 'arrow',
    };
    addShape(typeMap[type] || 'rect', options);
    saveState();
  }, [addShape, saveState, busy]);

  const handleApplyTemplate = useCallback(async (templateId: string) => {
    if (busy || applyingRef.current) return;
    if (canvas && canvas.getObjects().some(o => o.selectable && !o.excludeFromExport) && !window.confirm('Replace your current layout? You can undo this change.')) return;
    applyingRef.current = true; setApplying(true);
    try {
      let data: DesignTemplateData | undefined = getTemplateById(templateId);
      if (!data) {
        const response = await fetch('/api/design/templates/' + encodeURIComponent(templateId), { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('The template could not be loaded.');
        data = await response.json();
      }
      if (!data || data.shape !== shape) throw new Error('Choose a template for this product shape.');
        const json = canvasForTemplate(data, shape, widthInches, heightInches);
      await loadFromJSON(json); saveState();
      toast.success('Layout applied. Select any text to make it yours.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Template loading failed. Your design was kept.'); }
    finally { applyingRef.current = false; setApplying(false); }
  }, [canvas, shape, widthInches, heightInches, loadFromJSON, saveState, busy]);

  const handleDownloadTemplate = useCallback(
    (format: DesignExportFormat) => {
        if (!guideAvailable) { toast.info('Custom outlines need a production guide. Include your layout size and outline with your quote.'); return; }
      // Dieline for this product: bleed, trim and safe-area guides.
      window.open(`/api/templates/${productId}?format=${format}`, '_blank');
      toast.success(
        `${format.toUpperCase()} template downloading — bleed, trim and safe-area guides included.`
      );
    },
      [productId, guideAvailable]
  );

  /* ---- Properties handlers ---- */
  const handleUpdateProperty = useCallback((property: string, value: number | string | boolean) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const propMap: Record<string, string> = {
      x: 'left', y: 'top', rotation: 'angle', text: 'text',
      fontFamily: 'fontFamily', fontSize: 'fontSize', fontColor: 'fill',
      textAlign: 'textAlign',
    };

    if (property === 'opacity') {
      active.set('opacity', (value as number) / 100);
    } else if (property === 'width') {
      if ((active.width ?? 1) > 0) active.set('scaleX', (value as number) / (active.width ?? 1));
    } else if (property === 'height') {
      if ((active.height ?? 1) > 0) active.set('scaleY', (value as number) / (active.height ?? 1));
    } else if (property === 'bold') {
      (active as Textbox).set('fontWeight', value ? 'bold' : 'normal');
    } else if (property === 'italic') {
      (active as Textbox).set('fontStyle', value ? 'italic' : 'normal');
    } else if (property === 'underline') {
      (active as Textbox).set('underline', !!value);
    } else if (property === 'fill') {
      active.set('fill', value as string);
    } else if (property === 'stroke') {
      active.set('stroke', value as string);
    } else {
      const fabricProp = propMap[property] || property;
      active.set(fabricProp as keyof FabricObject, value);
    }

    active.setCoords();
    canvas.requestRenderAll();
    saveState();

    setSelectedObject(prev => prev ? { ...prev, [property]: value } : null);
  }, [canvas, saveState]);

  const handleDeleteObject = useCallback(() => {
    deleteSelected();
    setSelectedObject(null);
    saveState();
  }, [deleteSelected, saveState]);

  /* ---- Count non-bg objects for empty hint ---- */
  const objectCount = canvas
    ? canvas.getObjects().filter(
        (obj) => !(obj as FabricObject & { _isBgRect?: boolean })._isBgRect &&
                 !(obj as FabricObject & { _isSnapGuide?: boolean })._isSnapGuide
      ).length
    : 0;

  return (
    <div ref={editorRef} style={{ height: `max(220px, calc(100dvh - ${editorTop}px))` }} className="relative flex flex-col bg-gray-950 pb-14 md:pb-0">
      {/* Top toolbar */}
      <input ref={fileRef} type="file" accept=".json,application/json" aria-label="Open editable design" className="hidden" onChange={e => { void handleOpenFile(e.target.files?.[0]); }} />
      <DesignToolbar productName={productName} canUndo={canUndo} canRedo={canRedo} busy={busy || reviewing}
        saveStatus={draft.status} saveMessage={draft.message} onUndo={undo} onRedo={redo}
        onSave={handleSave} onPreview={handlePreview} onExport={handleExport} onBackup={handleBackup}
        onOpen={() => fileRef.current?.click()} onRequestQuote={() => { void handleRequestQuote(); }} />
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-1 bg-gray-900 border-b border-gray-800 text-xs text-gray-300">
        <div className="flex items-center gap-1" aria-label="Choose your design path">
          <button aria-pressed={mode === 'design'} onClick={() => setMode('design')} className={`min-h-11 px-3 rounded-lg ${mode === 'design' ? 'bg-gray-800 text-white' : ''}`}>Design it yourself</button>
          <button aria-pressed={mode === 'team'} onClick={() => setMode('team')} className={`min-h-11 px-3 rounded-lg ${mode === 'team' ? 'bg-amber-500/15 text-amber-300' : 'text-amber-300'}`}>Upload artwork / Team proof</button>
        </div>
        <span className="hidden lg:inline ml-2">{widthInches} × {heightInches} in</span>
        <details className="relative ml-auto"><summary className="min-h-11 flex items-center cursor-pointer px-2">View & guides</summary><div className="absolute right-0 top-full z-40 w-64 rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-xl space-y-2">
          <label className="flex min-h-11 gap-2 items-center"><input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} />Bleed guide</label>
          <label className="flex min-h-11 gap-2 items-center"><input type="checkbox" checked={showSafeArea} onChange={e => setShowSafeArea(e.target.checked)} />Safe area</label>
          <p className="leading-relaxed text-gray-400">Layout guides only. Site guidance is 1/8 inch bleed and 1/4 inch safe inset; final dies, holes and embossing need production approval. Review exports have no bleed.</p>
          <p className="leading-relaxed text-gray-400">Drafts include your artwork and stay on this device. Save sends it online. Avoid shared devices for confidential artwork.</p>
        </div></details>
        <button aria-expanded={showProperties} className="min-h-11 px-2 text-gray-200" onClick={() => setShowProperties(v => !v)}>{showProperties ? 'Hide' : 'Edit'} layers</button>
      </div>

      {/* Main body */}
      <div className="relative flex flex-1 min-h-0">
        {busy && <div role="status" className="absolute inset-0 z-50 bg-gray-950/60 flex items-center justify-center text-white">Loading design…</div>}
        {/* Left sidebar (desktop only) */}
        {!isMobile && mode === 'design' && (
          <DesignSidebar
            shape={shape}
            width={widthInches} height={heightInches}
            onAddText={handleAddText}
            onAddImage={handleAddImage}
            onAddShape={handleAddShape}
            onApplyTemplate={handleApplyTemplate}
            onDownloadTemplate={handleDownloadTemplate}
            isMobile={false}
          />
        )}

        {/* Center canvas area */}
        <div
          ref={containerRef}
          className="relative flex-1 min-w-0 overflow-hidden"
          style={CHECKER_BG_STYLE}
        >
          {/* The Fabric.js canvas fills this entire container */}
          <canvas ref={canvasElRef} id="design-canvas" className="block w-full h-full" aria-label="Sign design canvas. Use layers and properties to select and edit objects." />

          {/* Guide labels (small text in corner) */}
          {(showBleed || showSafeArea) && (
            <div className="absolute top-2 left-2 flex gap-3 pointer-events-none z-10">
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

          {/* Zoom controls (bottom-right) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-gray-900/90 rounded-lg px-1 py-0.5 z-10">
            <button onClick={handleZoomOut} className="text-gray-400 hover:text-white text-xs min-h-11 min-w-11 px-2 py-1 transition-colors" aria-label="Zoom out">-</button>
            <span className="text-gray-400 text-xs font-mono min-w-[3ch] text-center select-none">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="text-gray-400 hover:text-white text-xs min-h-11 min-w-11 px-2 py-1 transition-colors" aria-label="Zoom in">+</button>
            <span className="w-px h-4 bg-gray-700 mx-0.5" />
            <button onClick={handleFitToScreen} className="text-gray-400 hover:text-white text-xs min-h-11 min-w-11 px-1.5 py-1 transition-colors" aria-label="Fit to screen" title="Fit to screen (Ctrl+0)">Fit</button>
          </div>

          {/* Pan hint */}
          <div className="hidden lg:block absolute bottom-3 left-3 pointer-events-none z-10">
            <span className="text-[10px] text-gray-600 select-none">Alt+drag or middle-click to pan | Scroll to zoom</span>
          </div>

          {/* Image positioning hint */}
          {imageHint && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-amber-600/90 text-white text-sm rounded-lg shadow-lg pointer-events-none animate-fade-in">
              {imageHint}
            </div>
          )}

          {/* Hint when canvas is empty */}
          {canvas && objectCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center">
                <p className="text-gray-500 text-lg font-medium">Start designing</p>
                <p className="text-gray-600 text-sm mt-1">Add text, upload images, or pick a template</p>
              </div>
            </div>
          )}
        </div>

        {mode === 'team' && <section aria-label="Let us prepare your proof" className="absolute inset-0 z-20 overflow-y-auto bg-gray-950 p-5 sm:p-8">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6 items-start">
            <div><p className="text-xs tracking-widest text-amber-300 mb-3">A LITTLE HELP FROM OUR TEAM</p><h2 className="text-2xl font-semibold text-white mb-3">Your artwork. Our finishing touch.</h2><p className="text-sm leading-relaxed text-gray-300 mb-4">Upload your logo or artwork. We’ll use your saved design and preferences to prepare a proof for your approval.</p><ol className="space-y-3 text-sm text-gray-300"><li>1. Add artwork to your layout</li><li>2. Review the automatic preview & embossing intent</li><li>3. Continue to the quote form to request a team proof</li></ol><p className="mt-4 text-xs text-gray-400">Already have a design on the canvas? It stays in place. New artwork is added as another layer. PDF, AI and PSD need a separate team handoff; this editor accepts image previews only.</p></div>
            <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4"><UploadPanel onAddImage={handleAddImage} /><button disabled={busy || reviewing || objectCount === 0} onClick={() => { void handlePreview(); }} className="mt-4 w-full min-h-11 rounded-lg bg-amber-500 text-gray-950 font-semibold disabled:opacity-40">Review artwork & embossing</button><button onClick={() => setMode('design')} className="mt-2 min-h-11 w-full text-xs text-gray-300">Back to canvas</button><p className="mt-2 text-xs text-gray-400">Artwork stays on this device until you choose Save or continue to the quote form. No request has been sent.</p></div>
          </div>
        </section>}
        {/* Right properties panel */}
        {mode === 'design' && showProperties && (
          <div className={isMobile ? "absolute inset-x-0 bottom-0 z-30 max-h-[50dvh] overflow-y-auto bg-gray-900" : "w-64 shrink-0 overflow-y-auto"}>
          <details open={!selectedObject} className="p-3 border-b border-gray-700"><summary className="min-h-11 cursor-pointer text-sm text-white">Layers</summary><div>


            <div className="space-y-1 max-h-28 overflow-auto">
              {canvas?.getObjects().filter(o => o.selectable && !o.excludeFromExport).map((o, index) => <button key={index} className="block w-full min-h-11 rounded bg-gray-800 text-gray-100 px-2 text-left text-xs truncate focus-visible:outline-2 focus-visible:outline-amber-400" onClick={() => { canvas.setActiveObject(o); canvas.requestRenderAll(); }}>{index + 1}. {o instanceof Textbox ? o.text : o.type}</button>)}
            </div>
          </div>
          </details>
          <DesignProperties
            selectedObject={selectedObject}
            onUpdateProperty={handleUpdateProperty}
            onDelete={handleDeleteObject}
            onDuplicate={async () => { await duplicateSelected(); saveState(); }}
            onBringToFront={() => { bringToFront(); saveState(); }}
            onSendToBack={() => { sendToBack(); saveState(); }}
            onBringForward={() => { bringForward(); saveState(); }}
            onSendBackward={() => { sendBackward(); saveState(); }}
          />
          </div>
        )}
      </div>

      {proof && <ProofReview snapshot={proof} width={widthInches} height={heightInches} onClose={() => setProof(null)} onIntentChange={handleProofIntent} onAttach={handleAttachProof} canAttach={cart.items.some(i => i.product.id === productId)} onRequest={() => handleRequestQuote(true)} busy={busy || attaching || draft.status === 'saving'} />}
      {/* Mobile bottom bar */}
      {isMobile && mode === 'design' && (
        <DesignSidebar
          shape={shape}
            width={widthInches} height={heightInches}
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
