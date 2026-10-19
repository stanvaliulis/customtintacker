'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ProductShape } from '@/types/product';

const DesignEditor = dynamic(
  () => import('@/components/design/DesignEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading design editor...</p>
        </div>
      </div>
    ),
  }
);

interface DesignEditorLoaderProps {
  productId: string;
  productName: string;
  shape: ProductShape;
  width: number;
  height: number;
  displaySize: string;
}

export default function DesignEditorLoader(props: DesignEditorLoaderProps) {
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState('');
  if (![props.width, props.height].every(n => Number.isFinite(n) && n > 0)) {
    if (customSize) return <DesignEditor {...props} {...customSize} guideAvailable={false} displaySize={`${customSize.width}" x ${customSize.height}" custom layout`} />;
    return <section className="min-h-[70vh] bg-gray-900 text-white px-5 py-12">
      <form className="max-w-lg mx-auto space-y-5" onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const width = Number(data.get('width')), height = Number(data.get('height'));
        if (![width, height].every(n => Number.isFinite(n) && n > 0 && n <= 100000 / 72)) { setError('Enter positive dimensions within the editor’s supported canvas size.'); return; }
        setError(''); setCustomSize({ width, height });
      }}>
        <h1 className="text-2xl font-semibold">Set your custom layout size</h1>
        <p className="text-gray-300">Enter the width and height you want to plan in inches. This is a layout area; your final cut shape, size and mounting holes need an approved production proof.</p>
        <div className="grid grid-cols-2 gap-4">{['width', 'height'].map(name => <label key={name} className="text-sm capitalize">{name} (inches)<input name={name} type="number" min="0.01" step="any" required className="mt-2 block w-full min-h-11 rounded border border-gray-600 bg-gray-800 px-3 text-white" /></label>)}</div>
        {error && <p role="alert" className="text-amber-300">{error}</p>}
        <p className="text-xs text-gray-400">To reopen a saved custom design, enter the same dimensions used when saving it.</p>
        <button type="submit" className="min-h-11 rounded bg-amber-500 px-5 font-semibold text-gray-950">Start custom layout</button>
      </form>
    </section>;
  }
  return <DesignEditor {...props} />;
}
