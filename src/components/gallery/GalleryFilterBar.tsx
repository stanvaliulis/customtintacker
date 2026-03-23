'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { galleryIndustries, galleryShapes } from '@/data/gallery';

export default function GalleryFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeIndustry = searchParams.get('industry') || '';
  const activeShape = searchParams.get('shape') || '';

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset the other filter when switching
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {/* Industry filters */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-medium">
          Industry
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('industry', '')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeIndustry
                ? 'bg-amber-500 text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            All
          </button>
          {galleryIndustries.map((industry) => (
            <button
              key={industry}
              onClick={() =>
                setFilter('industry', activeIndustry === industry ? '' : industry)
              }
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeIndustry === industry
                  ? 'bg-amber-500 text-gray-950'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      {/* Shape filters */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-medium">
          Shape
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('shape', '')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeShape
                ? 'bg-amber-500 text-gray-950'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            All
          </button>
          {galleryShapes.map((shape) => (
            <button
              key={shape}
              onClick={() =>
                setFilter('shape', activeShape === shape ? '' : shape)
              }
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeShape === shape
                  ? 'bg-amber-500 text-gray-950'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
