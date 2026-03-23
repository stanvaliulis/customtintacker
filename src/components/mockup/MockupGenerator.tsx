'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductShape } from '@/types/product';
import { SHAPE_DEFINITIONS } from '@/lib/design/shapes';
import ShapeSelector from './ShapeSelector';
import ColorPicker from './ColorPicker';
import Link from 'next/link';

// ─── Shape aspect ratios (matching the viewBox ratios from shapes.ts) ────
const SHAPE_ASPECT_RATIOS: Record<ProductShape, { w: number; h: number }> = {
  square: { w: 400, h: 400 },
  rectangle: { w: 480, h: 360 },
  circle: { w: 400, h: 400 },
  can: { w: 300, h: 500 },
  'bottle-cap': { w: 400, h: 400 },
  'die-cut': { w: 400, h: 400 },
  shield: { w: 360, h: 440 },
  arrow: { w: 500, h: 320 },
  'street-sign': { w: 600, h: 120 },
  'license-plate': { w: 480, h: 240 },
};

// ─── Sample logos (inline SVG data URLs) ──────────────────────────
const SAMPLE_LOGOS = [
  {
    name: 'Hop House Brewery',
    url: generateSampleSvgDataUrl('HOP HOUSE', 'BREWERY', '#D97706', '#92400E'),
  },
  {
    name: 'Mountain Craft Co.',
    url: generateSampleSvgDataUrl('MOUNTAIN', 'CRAFT CO.', '#059669', '#065F46'),
  },
  {
    name: 'Red Rock BBQ',
    url: generateSampleSvgDataUrl('RED ROCK', 'BBQ & GRILL', '#DC2626', '#991B1B'),
  },
  {
    name: 'Pacific Surf',
    url: generateSampleSvgDataUrl('PACIFIC', 'SURF SHOP', '#2563EB', '#1E40AF'),
  },
];

function generateSampleSvgDataUrl(
  line1: string,
  line2: string,
  color1: string,
  color2: string,
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="transparent"/>
    <circle cx="200" cy="100" r="60" fill="none" stroke="${color1}" stroke-width="4"/>
    <text x="200" y="90" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="28" fill="${color1}">${line1}</text>
    <text x="200" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-weight="400" font-size="16" fill="${color2}">${line2}</text>
    <line x1="80" y1="170" x2="320" y2="170" stroke="${color1}" stroke-width="2"/>
    <text x="200" y="200" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="${color1}">${line1}</text>
    <text x="200" y="230" text-anchor="middle" font-family="Arial,sans-serif" font-weight="400" font-size="18" fill="${color2}">${line2}</text>
    <text x="200" y="265" text-anchor="middle" font-family="Arial,sans-serif" font-weight="300" font-size="12" fill="${color2}">EST. 2024</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─── Canvas rendering constants ────────────────────────────
const CANVAS_SIZE = 800; // Base resolution for rendering
const MOUNTING_HOLE_RADIUS = 6;

export default function MockupGenerator() {
  const searchParams = useSearchParams();
  const initialShape = (searchParams.get('shape') as ProductShape) || 'rectangle';

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedShape, setSelectedShape] = useState<ProductShape>(initialShape);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [isDragging, setIsDragging] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // ─── File handling ────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file type. Please upload PNG, JPG, SVG, or PDF.');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const loadSampleLogo = useCallback((url: string, name: string) => {
    setUploadedImage(url);
    setUploadedFileName(name);
  }, []);

  // ─── Canvas rendering ────────────────────────────
  const renderMockup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);

    const aspect = SHAPE_ASPECT_RATIOS[selectedShape] || { w: 400, h: 400 };
    const scale = CANVAS_SIZE / Math.max(aspect.w, aspect.h);
    const w = Math.round(aspect.w * scale);
    const h = Math.round(aspect.h * scale);

    // Add padding for shadow
    const padding = 60;
    canvas.width = w + padding * 2;
    canvas.height = h + padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(padding, padding);

    // Get shape path
    const shapeDef = SHAPE_DEFINITIONS[selectedShape];
    const pathData = shapeDef.getPath(w, h);
    const shapePath = new Path2D(pathData);

    // ─── Drop shadow ────────────────────────────
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#333';
    ctx.fill(shapePath);
    ctx.restore();

    // ─── Background fill with shape clip ────────────────────────────
    ctx.save();
    ctx.clip(shapePath);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Draw uploaded image if present
    if (logoImageRef.current && logoImageRef.current.complete && logoImageRef.current.naturalWidth > 0) {
      const img = logoImageRef.current;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;

      let drawW: number, drawH: number;

      // Fit image within 80% of the shape area
      const fitScale = 0.75;
      if (imgAspect > canvasAspect) {
        drawW = w * fitScale;
        drawH = drawW / imgAspect;
      } else {
        drawH = h * fitScale;
        drawW = drawH * imgAspect;
      }
      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // ─── Metallic gradient overlay ────────────────────────────
    const metallicGrad = ctx.createLinearGradient(0, 0, w, h);
    metallicGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    metallicGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)');
    metallicGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
    metallicGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
    metallicGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
    ctx.fillStyle = metallicGrad;
    ctx.fillRect(0, 0, w, h);

    // ─── Brushed aluminum texture ────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let y = 0; y < h; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.strokeStyle = y % 4 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore(); // Restore from shape clip

    // ─── Embossed border ────────────────────────────
    // Outer highlight (top-left light)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke(shapePath);
    ctx.restore();

    // Inner shadow (bottom-right dark)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke(shapePath);
    ctx.restore();

    // Second inner border for embossed effect
    ctx.save();
    ctx.clip(shapePath);
    const innerBorderInset = 8;
    ctx.translate(innerBorderInset, innerBorderInset);
    const innerW = w - innerBorderInset * 2;
    const innerH = h - innerBorderInset * 2;
    const innerScale = Math.min(innerW / w, innerH / h);
    ctx.scale(innerScale, innerScale);
    const innerPath = new Path2D(shapeDef.getPath(w, h));

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2 / innerScale;
    ctx.stroke(innerPath);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 / innerScale;
    ctx.translate(1, 1);
    ctx.stroke(innerPath);
    ctx.restore();

    // ─── Mounting holes ────────────────────────────
    const mountingHoles = getMountingHolePositions(selectedShape, w, h);
    mountingHoles.forEach(({ x, y }) => {
      // Hole shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, MOUNTING_HOLE_RADIUS + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      ctx.restore();

      // Hole
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, MOUNTING_HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e'; // Dark background showing through
      ctx.fill();
      ctx.restore();

      // Hole inner highlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, MOUNTING_HOLE_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Hole ring emboss
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, MOUNTING_HOLE_RADIUS + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });

    // ─── Specular highlight ────────────────────────────
    ctx.save();
    ctx.clip(shapePath);
    const specGrad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.6);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.restore(); // Restore from initial translate
    setIsRendering(false);
  }, [selectedShape, backgroundColor, uploadedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load and track the uploaded image
  useEffect(() => {
    if (!uploadedImage) {
      logoImageRef.current = null;
      renderMockup();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImageRef.current = img;
      renderMockup();
    };
    img.onerror = () => {
      logoImageRef.current = null;
      renderMockup();
    };
    img.src = uploadedImage;
  }, [uploadedImage, renderMockup]);

  // Re-render when shape or color changes
  useEffect(() => {
    renderMockup();
  }, [selectedShape, backgroundColor, renderMockup]);

  // ─── Download as PNG ────────────────────────────
  const downloadMockup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `tin-tacker-mockup-${selectedShape}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [selectedShape]);

  return (
    <div className="space-y-12">
      {/* ── Step 1: Upload ────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-gray-900 font-bold text-sm">
            1
          </span>
          <h2 className="text-xl font-bold text-white">Upload Your Logo or Artwork</h2>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : uploadedImage
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-gray-600 bg-gray-800/30 hover:border-gray-500 hover:bg-gray-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />

          {uploadedImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-700 border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedImage}
                  alt="Uploaded artwork"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold">{uploadedFileName}</p>
                <p className="text-sm text-gray-400 mt-1">Click or drag to replace</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <div>
                <p className="text-white font-semibold text-lg">
                  Drag & drop your logo here
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  or click to browse. PNG, JPG, SVG, PDF up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sample logos */}
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">Or try with a sample logo:</p>
          <div className="flex flex-wrap gap-3">
            {SAMPLE_LOGOS.map((sample) => (
              <button
                key={sample.name}
                onClick={() => loadSampleLogo(sample.url, sample.name)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.25" />
                </svg>
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step 2: Pick a Shape ────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-gray-900 font-bold text-sm">
            2
          </span>
          <h2 className="text-xl font-bold text-white">Pick a Shape</h2>
        </div>
        <ShapeSelector selectedShape={selectedShape} onShapeChange={setSelectedShape} />
      </section>

      {/* ── Step 3: Background Color ────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-gray-900 font-bold text-sm">
            3
          </span>
          <h2 className="text-xl font-bold text-white">Pick a Background Color</h2>
        </div>
        <ColorPicker selectedColor={backgroundColor} onColorChange={setBackgroundColor} />
      </section>

      {/* ── Live Preview ────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-gray-900 font-bold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <h2 className="text-xl font-bold text-white">Live Preview</h2>
          {isRendering && (
            <span className="text-xs text-amber-400 animate-pulse">Rendering...</span>
          )}
        </div>

        {/* Preview container with CSS perspective */}
        <div className="relative bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl border border-gray-700/50 p-6 sm:p-10 overflow-hidden">
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 11px)',
            }}
          />

          {/* Wall shadow behind the sign */}
          <div className="relative flex items-center justify-center py-8">
            <div
              className="relative transition-all duration-500"
              style={{
                perspective: '1200px',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <div
                style={{
                  transform: 'rotateY(-3deg) rotateX(2deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  style={{
                    maxWidth: '100%',
                    filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Floating label */}
          <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-medium">
            Preview - Not actual print quality
          </div>
        </div>
      </section>

      {/* ── Actions ────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={downloadMockup}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Mockup
        </button>

        <Link
          href={`/quote?shape=${selectedShape}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg border border-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
          </svg>
          Get a Quote for This Sign
        </Link>

        <Link
          href={`/design`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg border border-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.764m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          Start Designing
        </Link>
      </section>
    </div>
  );
}

// ─── Helper: mounting hole positions per shape ────────────────────────────
function getMountingHolePositions(
  shape: ProductShape,
  w: number,
  h: number,
): { x: number; y: number }[] {
  const margin = 20;
  const holeR = MOUNTING_HOLE_RADIUS + 4;

  switch (shape) {
    case 'circle':
    case 'bottle-cap':
    case 'die-cut':
      // Top and bottom center
      return [
        { x: w / 2, y: margin + holeR },
        { x: w / 2, y: h - margin - holeR },
      ];
    case 'can':
      // Top center only
      return [
        { x: w / 2, y: margin + holeR + 20 },
      ];
    case 'shield':
      // Top left and right
      return [
        { x: w * 0.3, y: h * 0.18 },
        { x: w * 0.7, y: h * 0.18 },
      ];
    case 'arrow':
      // Two on the body portion
      return [
        { x: w * 0.25, y: h / 2 },
        { x: w * 0.65, y: h / 2 },
      ];
    case 'street-sign':
    case 'license-plate':
      // Four corners
      return [
        { x: margin + holeR + 10, y: margin + holeR },
        { x: w - margin - holeR - 10, y: margin + holeR },
        { x: margin + holeR + 10, y: h - margin - holeR },
        { x: w - margin - holeR - 10, y: h - margin - holeR },
      ];
    default:
      // Square, rectangle: two holes at top
      return [
        { x: margin + holeR + 10, y: margin + holeR },
        { x: w - margin - holeR - 10, y: margin + holeR },
      ];
  }
}
