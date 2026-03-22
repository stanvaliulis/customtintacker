'use client';

import { useState, useRef } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';

export interface ImageRow {
  url: string;
  alt: string;
  sortOrder: number;
}

interface ImageUploaderProps {
  images: ImageRow[];
  onChange: (images: ImageRow[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const newImages = [...images];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const { url } = await res.json();
          newImages.push({ url, alt: file.name.replace(/\.[^.]+$/, ''), sortOrder: newImages.length });
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    onChange(newImages);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
    onChange(updated);
  }

  function addByUrl() {
    const url = prompt('Enter image URL:');
    if (url) {
      onChange([...images, { url, alt: '', sortOrder: images.length }]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="aspect-square flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                value={img.alt}
                onChange={(e) => {
                  const updated = [...images];
                  updated[i] = { ...updated[i], alt: e.target.value };
                  onChange(updated);
                }}
                placeholder="Alt text"
                className="w-full text-xs px-2 py-1 border-t border-gray-200 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex-1">
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-amber-400 transition-colors ${uploading ? 'opacity-50' : ''}`}
          >
            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload'}</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          onClick={addByUrl}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Add URL
        </button>
      </div>
    </div>
  );
}
