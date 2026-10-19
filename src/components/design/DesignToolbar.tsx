'use client';
import { Undo2, Redo2, Save, MoreHorizontal } from 'lucide-react';
import type { DesignExportFormat } from '@/types/design';
import type { SaveStatus } from '@/hooks/useDesignDraft';
import Link from 'next/link';
interface Props {
  productName: string; canUndo: boolean; canRedo: boolean; busy: boolean;
  saveStatus: SaveStatus; saveMessage: string;
  onUndo: () => void; onRedo: () => void; onSave: () => void;
  onExport: (format: DesignExportFormat) => void; onPreview: () => void;
  onBackup: () => void; onOpen: () => void; onRequestQuote: () => void;
}
export default function DesignToolbar(p: Props) {
  const button = 'min-h-11 min-w-11 px-3 rounded-lg text-gray-100 text-sm inline-flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber-400';
  return <header className="shrink-0 border-b border-gray-800 bg-gray-950 px-3 py-2">
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <div className="min-w-0 flex-1 basis-full sm:basis-0 mb-1 sm:mb-0"><h1 className="truncate text-sm text-white font-semibold">{p.productName}</h1><p role="status" aria-live="polite" className={`text-xs ${p.saveStatus === 'error' ? 'text-amber-300' : 'text-gray-400'}`}>{p.saveMessage}</p></div>
      <div className="flex border border-gray-800 rounded-lg"><button className={button} disabled={!p.canUndo || p.busy} onClick={p.onUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={17} /></button><button className={button} disabled={!p.canRedo || p.busy} onClick={p.onRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={17} /></button></div>
      <button className={button} disabled={p.busy || p.saveStatus === 'saving'} onClick={p.onSave}><Save size={16} /><span>Save</span></button>
      <details className="relative">
        <summary aria-label="File and export options" className={`${button} cursor-pointer list-none`}><MoreHorizontal size={20} /></summary>
        <div className="absolute right-0 z-50 mt-2 p-2 w-64 rounded-xl border border-gray-700 bg-gray-900 shadow-xl">
          <Link href="/design" className={`${button} w-full`}>Change product</Link>
          <button disabled={p.busy} className={`${button} w-full`} onClick={p.onOpen}>Reopen editable file</button>
          <button disabled={p.busy} className={`${button} w-full`} onClick={p.onBackup}>Editable backup (.json)</button>
          <button disabled={p.busy} className={`${button} w-full`} onClick={() => p.onExport('png')}>PNG preview</button>
          <button disabled={p.busy} className={`${button} w-full`} onClick={() => p.onExport('svg')}>SVG artwork</button>
          <button disabled={p.busy} className={`${button} w-full`} onClick={() => p.onExport('print-png')}>300 DPI review PNG</button>
          <button disabled={p.busy} className={`${button} w-full`} onClick={p.onRequestQuote}>Save & request pricing</button>
          <p className="text-xs text-gray-400 p-2">Exports need production proof approval. Drafts and backups contain your artwork. Save sends the design online.</p>
        </div>
      </details>
      <button className={`${button} ml-auto bg-amber-500 hover:bg-amber-400 !text-gray-950 font-semibold`} disabled={p.busy} onClick={p.onPreview}>Review proof</button>
    </div>
  </header>;
}
