'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRight, Check, Sparkles, Info, Clock } from 'lucide-react';
import { RUSH_FEE_RATE } from '@/context/CartContext';
import { products, backingOptions } from '@/data/products';
import { formatPrice, getPriceForQuantity } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { Product, BackingOption, ProductShape } from '@/types/product';
import Button from '@/components/ui/Button';

/* ------------------------------------------------------------------ */
/*  Shape definitions with SVG icons                                   */
/* ------------------------------------------------------------------ */

interface ShapeDefinition {
  id: ProductShape;
  label: string;
  icon: React.ReactNode;
}

const SHAPES: ShapeDefinition[] = [
  {
    id: 'square',
    label: 'Square',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="8" y="8" width="48" height="48" rx="3" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="32" cy="32" r="26" />
      </svg>
    ),
  },
  {
    id: 'can',
    label: 'Can Shape',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 8 C18 8 22 4 32 4 C42 4 46 8 46 8 L46 56 C46 56 42 60 32 60 C22 60 18 56 18 56 Z" />
        <ellipse cx="32" cy="8" rx="14" ry="4" />
      </svg>
    ),
  },
  {
    id: 'bottle-cap',
    label: 'Bottle Cap',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M32 4 L36 10 L44 8 L42 16 L50 18 L46 24 L52 30 L46 34 L50 40 L42 42 L44 50 L36 48 L32 54 L28 48 L20 50 L22 42 L14 40 L18 34 L12 30 L18 24 L14 18 L22 16 L20 8 L28 10 Z" />
      </svg>
    ),
  },
  {
    id: 'die-cut',
    label: 'Custom Die-Cut',
    icon: (
      <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10 20 Q10 10 20 10 L44 10 Q54 10 54 20 L54 35 Q54 42 48 46 L34 56 Q32 58 30 56 L16 46 Q10 42 10 35 Z" />
        <path d="M24 28 L30 34 L40 22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Preset quantity buttons                                            */
/* ------------------------------------------------------------------ */

const QUANTITY_PRESETS = [25, 50, 100, 250, 500, 1000];

/* ------------------------------------------------------------------ */
/*  Helper: get products available for a given shape                    */
/* ------------------------------------------------------------------ */

function getProductsForShape(shape: ProductShape): Product[] {
  return products.filter((p) => p.shape === shape).sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function QuoteBuilder() {
  const { addItem } = useCart();

  // Wizard state
  const [selectedShape, setSelectedShape] = useState<ProductShape | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBacking, setSelectedBacking] = useState<BackingOption>('standard-024');
  const [quantity, setQuantity] = useState<number>(100);
  const [isRush, setIsRush] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Derived data
  const availableProducts = useMemo(
    () => (selectedShape ? getProductsForShape(selectedShape) : []),
    [selectedShape]
  );

  const backingConfig = useMemo(
    () => backingOptions.find((b) => b.id === selectedBacking)!,
    [selectedBacking]
  );

  // Price calculations
  const priceCalc = useMemo(() => {
    if (!selectedProduct) return null;

    const basePricePerUnit = getPriceForQuantity(selectedProduct.pricingTiers, quantity);
    if (!basePricePerUnit) return null;

    const adjustedPerUnit = Math.round(basePricePerUnit * backingConfig.priceMultiplier);
    const setupFee = selectedProduct.setupFee;
    const subtotal = adjustedPerUnit * quantity;
    const rushFee = isRush ? Math.round(subtotal * RUSH_FEE_RATE) : 0;
    const total = subtotal + rushFee + setupFee;

    return { basePricePerUnit, adjustedPerUnit, setupFee, subtotal, rushFee, total };
  }, [selectedProduct, quantity, backingConfig, isRush]);

  // Handlers
  const handleShapeSelect = useCallback(
    (shape: ProductShape) => {
      setSelectedShape(shape);
      setSelectedProduct(null);
      setAddedToCart(false);
      // Auto-select if only one product for this shape
      const prods = getProductsForShape(shape);
      if (prods.length === 1) {
        setSelectedProduct(prods[0]);
        setQuantity(prods[0].minimumOrder);
      }
    },
    []
  );

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setQuantity(product.minimumOrder);
    setAddedToCart(false);
  }, []);

  const handleQuantityChange = useCallback(
    (val: number) => {
      if (!selectedProduct) return;
      const min = selectedProduct.minimumOrder;
      const clamped = Math.max(min, Math.min(1000, val));
      setQuantity(clamped);
      setAddedToCart(false);
    },
    [selectedProduct]
  );

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !priceCalc) return;
    addItem(selectedProduct, quantity, selectedBacking, 'retail', isRush);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }, [selectedProduct, priceCalc, addItem, quantity, selectedBacking, isRush]);

  const isDieCut = selectedShape === 'die-cut';

  /* ---------------------------------------------------------------- */
  /*  Step indicator helper                                            */
  /* ---------------------------------------------------------------- */

  function StepHeader({
    step,
    title,
    completed,
  }: {
    step: number;
    title: string;
    completed: boolean;
  }) {
    return (
      <div className="flex items-center gap-3 mb-5">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
            completed
              ? 'bg-amber-600 text-white'
              : 'bg-gray-800 text-gray-300'
          }`}
        >
          {completed ? <Check className="w-4 h-4" /> : step}
        </span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ---------------------------------------------------------- */}
      {/*  LEFT COLUMN – Steps                                        */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:col-span-2 space-y-8">
        {/* ====== Step 1 – Shape ====== */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <StepHeader step={1} title="Choose Your Shape" completed={!!selectedShape} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SHAPES.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleShapeSelect(shape.id)}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  selectedShape === shape.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md shadow-amber-100'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`transition-colors ${
                    selectedShape === shape.id ? 'text-amber-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {shape.icon}
                </div>
                <span className="text-sm font-medium text-center leading-tight">{shape.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ====== Step 2 – Size ====== */}
        <section
          className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity duration-300 ${
            !selectedShape ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <StepHeader step={2} title="Select Size" completed={!!selectedProduct} />
          {availableProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableProducts.map((product) => {
                const lowest = Math.min(...product.pricingTiers.map((t) => t.pricePerUnit));
                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                      selectedProduct?.id === product.id
                        ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{product.dimensions.displaySize}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{product.shortDescription.slice(0, 60)}...</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-sm font-bold text-amber-600">from {formatPrice(lowest)}</span>
                      <p className="text-xs text-gray-400">per unit</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : selectedShape ? (
            <p className="text-gray-500 text-sm">No standard sizes for this shape. Select a different shape or request a custom quote.</p>
          ) : null}
        </section>

        {/* ====== Step 3 – Material ====== */}
        <section
          className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity duration-300 ${
            !selectedProduct ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <StepHeader step={3} title="Material" completed={!!selectedProduct} />
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col p-4 rounded-xl border-2 border-amber-500 bg-amber-50 text-left">
              <span className="font-semibold text-gray-900 text-sm">{backingOptions[0]?.label ?? '.024" Gauge Aluminum'}</span>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{backingOptions[0]?.description ?? 'Industry-standard recycled aluminum.'}</p>
              <span className="text-xs font-medium text-green-600 mt-2">Included</span>
            </div>
          </div>
        </section>

        {/* ====== Step 4 – Quantity ====== */}
        <section
          className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity duration-300 ${
            !selectedProduct ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <StepHeader step={4} title="Set Quantity" completed={!!selectedProduct && quantity > 0} />

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            {QUANTITY_PRESETS.map((preset) => {
              const belowMin = selectedProduct ? preset < selectedProduct.minimumOrder : false;
              return (
                <button
                  key={preset}
                  disabled={belowMin}
                  onClick={() => handleQuantityChange(preset)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                    quantity === preset
                      ? 'bg-amber-600 text-white shadow-md'
                      : belowMin
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              );
            })}
          </div>

          {/* Slider + numeric input */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={selectedProduct?.minimumOrder ?? 25}
              max={5000}
              step={25}
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none bg-gray-200 accent-amber-600 cursor-pointer"
            />
            <input
              type="number"
              min={selectedProduct?.minimumOrder ?? 25}
              max={5000}
              step={1}
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              className="w-24 px-3 py-2 text-center text-sm font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Volume pricing breakpoints */}
          {selectedProduct && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Volume pricing</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {selectedProduct.pricingTiers.filter((t) => t.minQuantity <= 1000).map((tier) => {
                  const isActive =
                    quantity >= tier.minQuantity &&
                    (tier.maxQuantity === null || quantity <= tier.maxQuantity);
                  const adjusted = Math.round(tier.pricePerUnit * backingConfig.priceMultiplier);
                  return (
                    <div
                      key={tier.minQuantity}
                      className={`text-center px-2 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-amber-100 border border-amber-300 text-amber-800'
                          : 'bg-gray-50 border border-gray-200 text-gray-500'
                      }`}
                    >
                      <span className="block font-semibold">
                        {tier.minQuantity}
                        {tier.maxQuantity ? `-${tier.maxQuantity}` : '+'}
                      </span>
                      <span className={`block mt-0.5 font-bold ${isActive ? 'text-amber-700' : 'text-gray-700'}`}>
                        {formatPrice(adjusted)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ====== Step 5 – Rush Processing ====== */}
        <section
          className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-opacity duration-300 ${
            !selectedProduct ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <StepHeader step={5} title="Processing Speed" completed={!!selectedProduct} />
          <button
            type="button"
            onClick={() => setIsRush(!isRush)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
              isRush
                ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
            }`}
          >
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
              isRush ? 'bg-amber-600 text-white' : 'border border-gray-300 bg-white'
            }`}>
              {isRush && (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-gray-900 text-sm">Rush Processing</span>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">+25%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your order in ~15 business days instead of ~30. Rush fee is 25% of your order subtotal.
              </p>
            </div>
          </button>
        </section>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  RIGHT COLUMN – Live Price Summary                          */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold">Your Quote</h3>
            </div>

            {/* Selection summary */}
            <div className="space-y-3 text-sm mb-6">
              <SummaryRow
                label="Shape"
                value={selectedShape ? SHAPES.find((s) => s.id === selectedShape)?.label : '--'}
              />
              <SummaryRow
                label="Size"
                value={selectedProduct?.dimensions.displaySize ?? '--'}
              />
              <SummaryRow label="Gauge" value={backingConfig.label} />
              <SummaryRow label="Quantity" value={selectedProduct ? quantity.toLocaleString() : '--'} />
              <SummaryRow label="Rush" value={isRush ? 'Yes (+25%)' : 'Standard'} />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-700 mb-5" />

            {/* Prices */}
            {priceCalc ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price per unit</span>
                  <span className="font-semibold">{formatPrice(priceCalc.adjustedPerUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Subtotal ({quantity.toLocaleString()} units)
                  </span>
                  <span className="font-semibold">{formatPrice(priceCalc.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">One-time setup fee</span>
                  <span className="font-semibold">{formatPrice(priceCalc.setupFee)}</span>
                </div>

                {isRush && priceCalc.rushFee > 0 && (
                  <div className="flex justify-between py-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-400 font-medium flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      Rush fee
                    </span>
                    <span className="text-amber-400 font-semibold text-xs">+{formatPrice(priceCalc.rushFee)}</span>
                  </div>
                )}

                <div className="h-px bg-gray-700 my-1" />

                <div className="flex justify-between items-baseline">
                  <span className="text-gray-300 font-medium">Total</span>
                  <span className="text-2xl font-bold text-amber-400">
                    {formatPrice(priceCalc.total)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                Configure your sign above to see pricing.
              </p>
            )}

            {/* CTA buttons */}
            <div className="mt-6 space-y-3">
              {isDieCut ? (
                <Link
                  href="/quote"
                  className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
                >
                  Request Custom Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!priceCalc}
                  onClick={handleAddToCart}
                >
                  {addedToCart ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Added to Cart
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </span>
                  )}
                </Button>
              )}

              <Link
                href="/quote"
                className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors"
              >
                Need something custom? Request a quote
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Lead time callout */}
          {selectedProduct && (
            <div className={`mt-4 rounded-xl p-4 text-sm border ${
              isRush ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200'
            }`}>
              <p className="font-semibold text-amber-800 mb-1">Estimated Lead Time</p>
              <p className="text-amber-700">
                {isRush ? '~15' : `~${selectedProduct.leadTimeDays}`} business days from artwork approval
                {isRush && <span className="block mt-1 text-xs text-amber-600 font-medium">Rush processing selected</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helper component for the summary sidebar                     */
/* ------------------------------------------------------------------ */

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-100">{value ?? '--'}</span>
    </div>
  );
}
