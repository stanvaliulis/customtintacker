'use client';

import { useState, useCallback } from 'react';
import Container from '@/components/ui/Container';
import { products } from '@/data/products';
import {
  Upload,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  MessageSquareQuote,
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Palette,
  Ruler,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import EmbossedMockup from '@/components/ai-designer/EmbossedMockup';
import type { ProductShape } from '@/types/product';

interface AnalysisResult {
  assessment: string;
  artworkQuality: 'high' | 'medium' | 'low';
  confidenceScore: number;
  layout: {
    recommendation: string;
    fillPercentage: string;
    orientation: string;
  };
  embossing: {
    recommendation: string;
    suggestedZones: string[];
  };
  colorNotes: string;
  productionNotes: string;
  suggestedChanges: string[];
}

interface PricingTier {
  quantity: string;
  pricePerUnit: string;
  total: string | null;
}

interface ProductInfo {
  id: string;
  name: string;
  shape: string;
  dimensions: { displaySize: string; width: number; height: number };
  pricingTiers: PricingTier[];
}

const shapesWithProducts = Array.from(
  new Set(products.filter((p) => p.pricingTiers.length > 0).map((p) => p.shape))
);

export default function AIDesignerPage() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableProducts = products.filter((p) => p.pricingTiers.length > 0);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20MB');
      return;
    }

    setError(null);
    setMediaType(file.type);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageData(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      handleFileUpload({ target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileUpload]);

  const handleAnalyze = async () => {
    if (!imageData || !selectedProductId) return;

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/ai-designer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mediaType, productId: selectedProductId, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setProductInfo(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAnalyzing(false);
    }
  };

  const qualityColor = {
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
  };

  const qualityBg = {
    high: 'bg-emerald-500/10 border-emerald-500/20',
    medium: 'bg-amber-500/10 border-amber-500/20',
    low: 'bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Container className="py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Design Assistant
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Design Your Tin Tacker
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Upload your artwork, pick a sign, and our AI will analyze your design for print-readiness, suggest embossing zones, and show you pricing instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-amber-400" />
                Choose your sign
              </h2>
              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={(e) => { setSelectedProductId(e.target.value); setAnalysis(null); }}
                  className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-xl text-white px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a product...</option>
                  {shapesWithProducts.map((shape) => (
                    <optgroup key={shape} label={shape.charAt(0).toUpperCase() + shape.slice(1).replace('-', ' ')}>
                      {availableProducts
                        .filter((p) => p.shape === shape)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.dimensions.displaySize}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Upload Area */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Upload your artwork
              </h2>

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Uploaded artwork"
                    className="w-full rounded-xl border border-gray-700 max-h-[400px] object-contain bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageData(null); setAnalysis(null); }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <label
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/50 cursor-pointer hover:border-amber-500/50 hover:bg-gray-800 transition-all"
                >
                  <ImageIcon className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-sm mb-1">Drag and drop your artwork here</p>
                  <p className="text-gray-500 text-xs">or click to browse — PNG, JPG up to 20MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-amber-400" />
                Notes (optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything specific you want? E.g., 'Make the logo embossed but not the background' or 'We need this for a brewery tap room'"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder:text-gray-600"
              />
            </div>

            {/* Analyze Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!imageData || !selectedProductId || analyzing}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-gray-950 transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your artwork...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze & Get Pricing
                </>
              )}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            {!analysis && !analyzing && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center h-full flex flex-col items-center justify-center">
                <Sparkles className="w-16 h-16 text-gray-700 mb-6" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to analyze</h3>
                <p className="text-gray-600 max-w-sm">
                  Select a product, upload your artwork, and hit analyze. Our AI will review your design in seconds.
                </p>
              </div>
            )}

            {analyzing && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center h-full flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-amber-400 mb-6 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Analyzing your artwork...</h3>
                <p className="text-gray-500">This usually takes 5-10 seconds</p>
              </div>
            )}

            {analysis && productInfo && imagePreview && (
              <>
                {/* Embossed Mockup — the hero output */}
                <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Your Embossed Tin Tacker
                  </h3>
                  <EmbossedMockup
                    imageUrl={imagePreview}
                    shape={productInfo.shape as ProductShape}
                    width={productInfo.dimensions.width}
                    height={productInfo.dimensions.height}
                    productName={productInfo.name}
                  />
                </div>

                {/* Pricing — right below the mockup */}
                <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                    Pricing — {productInfo.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-2 text-left text-gray-400 font-medium">Quantity</th>
                          <th className="py-2 text-right text-gray-400 font-medium">Per Unit</th>
                          <th className="py-2 text-right text-gray-400 font-medium">Est. Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productInfo.pricingTiers.map((tier) => (
                          <tr key={tier.quantity} className="border-b border-gray-800 last:border-0">
                            <td className="py-2.5 text-gray-300">{tier.quantity}</td>
                            <td className="py-2.5 text-right font-mono text-white">${tier.pricePerUnit}</td>
                            <td className="py-2.5 text-right font-mono text-gray-400">
                              {tier.total ? `$${tier.total}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/products/${products.find((p) => p.id === selectedProductId)?.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-amber-500 hover:bg-amber-600 text-gray-950 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </Link>
                  <Link
                    href={`/quote?product=${encodeURIComponent(productInfo.name)}&shape=${encodeURIComponent(productInfo.shape)}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <MessageSquareQuote className="w-5 h-5" />
                    Request Quote
                  </Link>
                </div>

                {/* AI Analysis — collapsible details */}
                <details className="rounded-2xl border border-gray-800 bg-gray-900/50">
                  <summary className="p-6 cursor-pointer font-semibold flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    AI Design Analysis
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full ${qualityBg[analysis.artworkQuality]}`}>
                      {analysis.confidenceScore}/10 ready
                    </span>
                  </summary>
                  <div className="px-6 pb-6 space-y-4 border-t border-gray-800 pt-4">
                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.assessment}</p>

                    {/* Embossing zones */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Embossing zones</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.embossing.suggestedZones.map((zone) => (
                          <span key={zone} className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                            {zone}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-400 text-sm mt-2">{analysis.embossing.recommendation}</p>
                    </div>

                    {/* Layout */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Layout</h4>
                      <p className="text-gray-300 text-sm">{analysis.layout.recommendation}</p>
                    </div>

                    {/* Color & production */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Print notes</h4>
                      <p className="text-gray-300 text-sm">{analysis.colorNotes}</p>
                      {analysis.productionNotes && (
                        <p className="text-gray-400 text-sm mt-1">{analysis.productionNotes}</p>
                      )}
                    </div>

                    {/* Suggested changes */}
                    {analysis.suggestedChanges?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggestions</h4>
                        <ul className="space-y-1">
                          {analysis.suggestedChanges.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-amber-400 mt-0.5">•</span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
