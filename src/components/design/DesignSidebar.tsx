'use client';

import { useState, useCallback } from 'react';
import {
  LayoutTemplate,
  Type,
  Upload,
  Shapes,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import TemplatePanel from './panels/TemplatePanel';
import TextPanel from './panels/TextPanel';
import UploadPanel from './panels/UploadPanel';
import ShapesPanel from './panels/ShapesPanel';
import type { ProductShape } from '@/types/product';
import type { DesignExportFormat } from '@/types/design';

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

type SidebarTab = 'templates' | 'text' | 'upload' | 'shapes';

interface TabDef {
  id: SidebarTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-5 h-5" /> },
  { id: 'text',      label: 'Text',      icon: <Type className="w-5 h-5" /> },
  { id: 'upload',    label: 'Upload',     icon: <Upload className="w-5 h-5" /> },
  { id: 'shapes',    label: 'Shapes',     icon: <Shapes className="w-5 h-5" /> },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DesignSidebarProps {
  shape: ProductShape;
  onAddText: (preset: 'heading' | 'subheading' | 'body') => void;
  onAddImage: (url: string) => void;
  onAddShape: (type: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onDownloadTemplate: (format: DesignExportFormat) => void;
  /** Mobile bottom sheet mode */
  isMobile?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DesignSidebar({
  shape,
  onAddText,
  onAddImage,
  onAddShape,
  onApplyTemplate,
  onDownloadTemplate,
  isMobile = false,
}: DesignSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab | null>(null);

  const handleTabClick = useCallback(
    (tabId: SidebarTab) => {
      setActiveTab((prev) => (prev === tabId ? null : tabId));
    },
    [],
  );

  const closePanel = useCallback(() => setActiveTab(null), []);

  /* ---- Panel renderer -------------------------------------------- */
  const renderPanel = () => {
    switch (activeTab) {
      case 'templates':
        return (
          <TemplatePanel
            shape={shape}
            onApplyTemplate={onApplyTemplate}
            onDownloadTemplate={onDownloadTemplate}
          />
        );
      case 'text':
        return <TextPanel onAddText={onAddText} />;
      case 'upload':
        return <UploadPanel onAddImage={onAddImage} />;
      case 'shapes':
        return <ShapesPanel onAddShape={onAddShape} />;
      default:
        return null;
    }
  };

  /* ================================================================ */
  /*  Mobile bottom sheet                                              */
  /* ================================================================ */

  if (isMobile) {
    return (
      <>
        {/* Tab strip at the bottom */}
        <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around h-14 bg-gray-900 border-t border-gray-800 md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-md transition-colors',
                activeTab === tab.id
                  ? 'text-amber-400'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Bottom sheet panel */}
        {activeTab && (
          <div className="fixed inset-x-0 bottom-14 z-30 max-h-[60vh] bg-gray-900 border-t border-gray-800 rounded-t-2xl overflow-y-auto md:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-200">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">{renderPanel()}</div>
          </div>
        )}
      </>
    );
  }

  /* ================================================================ */
  /*  Desktop sidebar                                                  */
  /* ================================================================ */

  return (
    <div className="hidden md:flex shrink-0 h-full">
      {/* Vertical tab strip */}
      <div className="flex flex-col items-center w-12 py-2 gap-1 bg-gray-900 border-r border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            title={tab.label}
            aria-label={tab.label}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              activeTab === tab.id
                ? 'text-amber-400 bg-gray-800'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
            )}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Expandable panel */}
      <div
        className={cn(
          'overflow-y-auto bg-gray-900 border-r border-gray-800 transition-all duration-200',
          activeTab ? 'w-60' : 'w-0',
        )}
      >
        {activeTab && (
          <div className="w-60">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-200">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">{renderPanel()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
