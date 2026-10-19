'use client';
import { useEffect, useState } from 'react';
import { getTemplatesByShape, type DesignTemplateData } from '@/data/design-templates';
import { buildTemplateCanvas } from '@/lib/design/template-layout';
import type { ProductShape } from '@/types/product';
import type { DesignExportFormat } from '@/types/design';
import TemplatePreview from '../TemplatePreview';

export default function TemplatePanel({ shape, width, height, onApplyTemplate, onDownloadTemplate }: {
  shape: ProductShape; width: number; height: number;
  onApplyTemplate: (id: string) => void; onDownloadTemplate: (format: DesignExportFormat) => void;
}) {
  const [templates, setTemplates] = useState<DesignTemplateData[]>(() => getTemplatesByShape(shape));
  const [query, setQuery] = useState('');
  const [fallback, setFallback] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setTemplates(getTemplatesByShape(shape));
    fetch(`/api/design/templates?shape=${encodeURIComponent(shape)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (!Array.isArray(data)) throw new Error(); setTemplates(data); setFallback(false); })
      .catch(() => { if (!controller.signal.aborted) setFallback(true); });
    return () => controller.abort();
  }, [shape, retry]);
  const filtered = templates.filter(t => `${t.name} ${t.category} ${t.tags}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-4">
    <p className="text-xs text-gray-300">Editable layouts fitted to your {width} × {height} inch sign. Replace the sample wording with your own.</p>
    <label className="block text-xs text-gray-300">Find a layout
      <input type="search" value={query} onChange={e => setQuery(e.target.value)} className="mt-1 w-full min-h-11 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white" placeholder="Name or industry" />
    </label>
    {fallback && <p role="status" className="text-xs text-amber-300">Showing built-in templates. <button className="underline min-h-11" onClick={() => setRetry(n => n + 1)}>Retry custom templates</button></p>}
    <div className="grid gap-3">
      {filtered.map(template => {
        const preview = template.style ? buildTemplateCanvas(shape, width, height, template.style) : null;
        return <button key={template.id} onClick={() => onApplyTemplate(template.id)} className="rounded-xl border border-gray-700 bg-gray-800 p-3 text-left hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
          <div className="h-36 p-2 rounded-lg bg-gray-950/50">{preview ? <TemplatePreview canvas={preview} shape={shape} label={`${template.name} layout preview`} /> : <div className="h-full flex flex-col justify-center items-center text-gray-300 text-sm"><span>Custom layout</span><span className="mt-2 text-xs">Open in the editor to preview all artwork</span></div>}</div>
          <span className="block mt-2 text-sm text-white font-semibold">{template.name}</span>
          <span className="text-xs text-gray-300">Use layout · editable text and colors</span>
        </button>;
      })}
    </div>
    {!filtered.length && <p className="text-sm text-gray-300">{templates.length ? 'No layouts match. Try another search.' : 'Start with your artwork or add text. Use the product guide below to plan your layout.'}</p>}
    <div className="border-t border-gray-700 pt-4">
      <h3 className="text-sm text-white font-semibold">Artwork guides</h3>
      <p className="text-xs text-gray-300 my-2">Guides include ⅛ inch bleed and ¼ inch inset. Confirm the final outline and mounting holes in your production proof.</p>
      <div className="flex gap-2">{(['svg', 'pdf', 'png'] as const).map(format => <button key={format} onClick={() => onDownloadTemplate(format)} className="min-h-11 flex-1 rounded border border-gray-600 text-white text-xs uppercase hover:bg-gray-700">{format}</button>)}</div>
    </div>
  </div>;
}
