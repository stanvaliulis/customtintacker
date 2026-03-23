'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface UploadPanelProps {
  onAddImage: (url: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
const ACCEPTED_EXTENSIONS = '.png,.jpg,.jpeg,.svg,.pdf,.ai,.psd';
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Uploaded file type                                                 */
/* ------------------------------------------------------------------ */

interface UploadedFile {
  id: string;
  name: string;
  thumbnailUrl: string;
  size: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function UploadPanel({ onAddImage }: UploadPanelProps) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- File validation ------------------------------------------- */
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    // Allow all accepted types plus AI/PSD via extension check
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['png', 'jpg', 'jpeg', 'svg', 'pdf', 'ai', 'psd'];
    if (!validExtensions.includes(ext ?? '')) {
      return 'Unsupported format. Use PNG, JPG, SVG, PDF, AI, or PSD.';
    }
    return null;
  }, []);

  /* ---- Handle files (drag or button) ----------------------------- */
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);

      // Create a local preview URL (real upload would go to the API)
      const previewUrl = URL.createObjectURL(file);
      const newUpload: UploadedFile = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        thumbnailUrl: previewUrl,
        size: file.size,
      };

      setUploads((prev) => [newUpload, ...prev]);
      setUploading(false);

      // Automatically add to canvas
      onAddImage(previewUrl);

      // Show positioning hint
      setHint('Click and drag to reposition your image');
      setTimeout(() => setHint(null), 4000);
    },
    [validateFile, onAddImage],
  );

  /* ---- Drag events ----------------------------------------------- */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  /* ---- Remove an upload ------------------------------------------ */
  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  /* ---- Format file size ------------------------------------------ */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* ---- Drop zone ---- */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors text-center cursor-pointer',
          isDragging
            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-500 hover:border-gray-600 hover:text-gray-400',
        )}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        <Upload className="w-8 h-8" />
        <p className="text-sm font-medium">
          {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-[11px] text-gray-600">
          PNG, JPG, SVG, PDF, AI, PSD (max {MAX_FILE_SIZE_MB}MB)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Choose File button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
      >
        <FileUp className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Choose File'}
      </button>

      {/* ---- Error message ---- */}
      {error && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ---- Positioning hint ---- */}
      {hint && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <ImageIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{hint}</span>
        </div>
      )}

      {/* ---- Uploaded gallery ---- */}
      {uploads.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Uploaded Files
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="group relative rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden"
              >
                {/* Thumbnail */}
                <button
                  type="button"
                  onClick={() => onAddImage(upload.thumbnailUrl)}
                  className="w-full aspect-square bg-gray-700 flex items-center justify-center overflow-hidden"
                >
                  {upload.thumbnailUrl.startsWith('blob:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={upload.thumbnailUrl}
                      alt={upload.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  )}
                </button>

                {/* File info */}
                <div className="px-1.5 py-1">
                  <p className="text-[10px] text-gray-400 truncate" title={upload.name}>
                    {upload.name}
                  </p>
                  <p className="text-[10px] text-gray-600">{formatSize(upload.size)}</p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeUpload(upload.id)}
                  className="absolute top-1 right-1 p-0.5 rounded bg-gray-900/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
