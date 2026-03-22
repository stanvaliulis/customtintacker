import type { Product as AppProduct, PricingTier, BackingOption, ProductCategory, ProductShape } from '@/types/product';
import { isDatabaseConfigured } from './env';

// Check if database is configured
const hasDatabase = isDatabaseConfigured();

// Lazy import static data (used as fallback)
async function getStaticProducts() {
  const { products } = await import('@/data/products');
  return products;
}

// Lazy import prisma (only when DB is configured)
async function getPrisma() {
  const { prisma } = await import('./db');
  return prisma;
}

const productIncludes = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  pricingTiers: { orderBy: { minQuantity: 'asc' as const } },
  backingOptions: true,
  features: { orderBy: { sortOrder: 'asc' as const } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbProductToApp(p: any): AppProduct {
  return {
    id: p.id,
    sku: p.sku ?? undefined,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    category: p.category as ProductCategory,
    shape: p.shape as ProductShape,
    dimensions: {
      width: p.width,
      height: p.height,
      displaySize: p.displaySize,
    },
    images: p.images.map((img: { url: string }) => img.url),
    pricingTiers: p.pricingTiers.map((t: { minQuantity: number; maxQuantity: number | null; pricePerUnit: number; catalogPrice?: number }): PricingTier => ({
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      pricePerUnit: t.pricePerUnit,
      catalogPrice: t.catalogPrice ?? t.pricePerUnit,
    })),
    wholesaleDiscount: p.wholesaleDiscount,
    backingOptions: p.backingOptions.map((b: { backingId: string }) => b.backingId as BackingOption),
    features: p.features.map((f: { text: string }) => f.text),
    minimumOrder: p.minimumOrder,
    leadTimeDays: p.leadTimeDays,
    inStock: p.inStock,
    featured: p.featured,
    sortOrder: p.sortOrder,
    setupFee: p.setupFee,
    metadata: {
      material: p.material,
      printMethod: p.printMethod,
      mountingHoles: p.mountingHoles,
      shrinkWrapped: p.shrinkWrapped,
      madeInUSA: p.madeInUSA,
    },
  };
}

export async function getAllProducts(): Promise<AppProduct[]> {
  if (!hasDatabase) return getStaticProducts();

  try {
    const prisma = await getPrisma();
    const products = await prisma.product.findMany({
      include: productIncludes,
      orderBy: { sortOrder: 'asc' },
    });
    // Fall back to static data if DB has no products (not yet seeded)
    if (products.length === 0) return getStaticProducts();
    return products.map(dbProductToApp);
  } catch {
    return getStaticProducts();
  }
}

export async function getProductBySlug(slug: string): Promise<AppProduct | null> {
  // Always check static data first since DB may not have products seeded
  const staticProducts = await getStaticProducts();
  const staticMatch = staticProducts.find((p) => p.slug === slug) || null;

  if (!hasDatabase) return staticMatch;

  try {
    const prisma = await getPrisma();
    const p = await prisma.product.findUnique({
      where: { slug },
      include: productIncludes,
    });
    if (!p) return staticMatch; // Fall back to static
    return dbProductToApp(p);
  } catch {
    return staticMatch;
  }
}

export async function getProductById(id: string): Promise<AppProduct | null> {
  const staticProducts = await getStaticProducts();
  const staticMatch = staticProducts.find((p) => p.id === id) || null;

  if (!hasDatabase) return staticMatch;

  try {
    const prisma = await getPrisma();
    const p = await prisma.product.findUnique({
      where: { id },
      include: productIncludes,
    });
    if (!p) return staticMatch;
    return dbProductToApp(p);
  } catch {
    return staticMatch;
  }
}

export async function getFeaturedProducts(): Promise<AppProduct[]> {
  const staticProducts = await getStaticProducts();
  const staticFeatured = staticProducts.filter((p) => p.featured).sort((a, b) => a.sortOrder - b.sortOrder);

  if (!hasDatabase) return staticFeatured;

  try {
    const prisma = await getPrisma();
    const products = await prisma.product.findMany({
      where: { featured: true },
      include: productIncludes,
      orderBy: { sortOrder: 'asc' },
    });
    if (products.length === 0) return staticFeatured;
    return products.map(dbProductToApp);
  } catch {
    return staticFeatured;
  }
}
