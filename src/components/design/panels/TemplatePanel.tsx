'use client';

import { useState, useEffect } from 'react';
import { FileDown, FileText, FileCode, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductShape } from '@/types/product';
import type { DesignExportFormat } from '@/types/design';

interface TemplatePanelProps {
  shape: ProductShape;
  onApplyTemplate: (templateId: string) => void;
  onDownloadTemplate: (format: DesignExportFormat) => void;
}

type TemplateCategory = 'all' | 'brewery' | 'bar' | 'restaurant' | 'cannabis' | 'general';

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'brewery', label: 'Brewery' },
  { id: 'bar', label: 'Bar' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'general', label: 'General' },
];

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  tags: string;
}

export default function TemplatePanel({
  shape,
  onApplyTemplate,
  onDownloadTemplate,
}: TemplatePanelProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch templates for this shape from the API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/design/templates?shape=${shape}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTemplates(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shape]);

  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter(
          (t) => t.category === activeCategory || t.category === 'general'
        );

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-amber-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500">No templates for this shape yet</p>
          <p className="text-[10px] text-gray-600 mt-1">Start with a blank canvas or upload your artwork</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onApplyTemplate(tpl.id)}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-amber-600/50 hover:bg-gray-800 transition-colors"
            >
              <div className="w-full aspect-square rounded bg-gray-700/50 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-5 h-5 text-gray-500 group-hover:text-amber-500 transition-colors mx-auto mb-1" />
                  <span className="text-[9px] text-gray-600 capitalize">{tpl.category}</span>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-gray-200 text-center leading-tight w-full">
                {tpl.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Download artwork template */}
      <div className="pt-3 border-t border-gray-800">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          <FileDown className="w-3.5 h-3.5" />
          Download Artwork Template
        </h4>
        <div className="space-y-1.5">
          {[
            { format: 'png' as DesignExportFormat, label: 'PNG Template', icon: <ImageIcon className="w-4 h-4" /> },
            { format: 'svg' as DesignExportFormat, label: 'SVG Template', icon: <FileCode className="w-4 h-4" /> },
            { format: 'pdf' as DesignExportFormat, label: 'PDF Template', icon: <FileText className="w-4 h-4" /> },
          ].map(({ format, label, icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => onDownloadTemplate(format)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 transition-colors"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
