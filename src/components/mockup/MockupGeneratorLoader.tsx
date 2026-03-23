'use client';

import dynamic from 'next/dynamic';

const MockupGenerator = dynamic(
  () => import('@/components/mockup/MockupGenerator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading mockup generator...</p>
        </div>
      </div>
    ),
  },
);

export default function MockupGeneratorLoader() {
  return <MockupGenerator />;
}
