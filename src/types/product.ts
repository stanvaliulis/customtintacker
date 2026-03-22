export type ProductShape = 'square' | 'rectangle' | 'circle' | 'can' | 'bottle-cap' | 'die-cut' | 'shield' | 'arrow' | 'street-sign' | 'license-plate';

export type BackingOption = 'standard-024' | 'heavy-032' | 'premium-040';

export type ProductCategory = 'standard' | 'circle' | 'can-shape' | 'specialty' | 'custom' | 'street-sign' | 'license-plate' | 'corrugated';

export interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number; // cents
}

export interface BackingConfig {
  id: BackingOption;
  label: string;
  gaugeThickness: string;
  description: string;
  priceMultiplier: number;
}

export interface Product {
  id: string;
  sku?: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: ProductCategory;
  shape: ProductShape;
  dimensions: {
    width: number;
    height: number;
    displaySize: string;
  };
  images: string[];
  pricingTiers: PricingTier[];
  wholesaleDiscount: number;
  backingOptions: BackingOption[];
  features: string[];
  minimumOrder: number;
  leadTimeDays: number;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  setupFee: number; // cents
  metadata: {
    material: string;
    printMethod: string;
    mountingHoles: number;
    shrinkWrapped: boolean;
    madeInUSA: boolean;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedBacking: BackingOption;
  unitPrice: number;
  artworkNotes?: string;
}
