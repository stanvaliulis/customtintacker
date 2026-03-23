export type ProductShape = 'square' | 'rectangle' | 'circle' | 'can' | 'bottle-cap' | 'die-cut' | 'shield' | 'arrow' | 'street-sign' | 'license-plate';

export type BackingOption = 'standard-024' | 'heavy-032' | 'premium-040';

export type ProductCategory = 'standard' | 'circle' | 'can-shape' | 'specialty' | 'custom' | 'street-sign' | 'license-plate' | 'corrugated';

export interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number; // cents (retail price)
  catalogPrice: number; // cents (ASI/SAGE list price — what distributors show in catalogs)
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

export type PriceTier = 'retail' | 'distributor';

export interface DistributorPricing {
  retailPrice: number;       // what regular customers see (cents)
  catalogPrice: number;      // what goes in ASI/SAGE catalogs — the "list" price distributors show their clients (cents)
  distributorCost: number;   // what the distributor pays us (cents)
  distributorSavings: number; // percentage saved vs retail (0-100)
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedBacking: BackingOption;
  unitPrice: number;
  priceTier: PriceTier;
  artworkNotes?: string;
  isRush?: boolean;
}
