'use client';

import dynamic from 'next/dynamic';
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
  return <DesignEditor {...props} />;
}
