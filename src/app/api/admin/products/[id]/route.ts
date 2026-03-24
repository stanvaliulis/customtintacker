import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { products as staticProducts } from '@/data/products';
import { readJsonFile, writeJsonFile } from '@/lib/json-store';

function getProductFromFiles(id: string) {
  const overrides = readJsonFile<Record<string, Record<string, unknown>>>('product-overrides.json', {});
  const customProducts = readJsonFile<Record<string, unknown>[]>('products-custom.json', []);

  // Check static products first
  const staticProduct = staticProducts.find((p) => p.id === id);
  if (staticProduct) {
    const override = overrides[id];
    return override ? { ...staticProduct, ...override, id: staticProduct.id, _source: 'static' as const } : { ...staticProduct, _source: 'static' as const };
  }

  // Check custom products
  const customProduct = customProducts.find((p) => p.id === id);
  if (customProduct) {
    return { ...customProduct, _source: 'custom' as const };
  }

  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          pricingTiers: { orderBy: { minQuantity: 'asc' } },
          backingOptions: true,
          features: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!product) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(product);
    } catch (err) {
      console.error('Admin product GET error:', err);
    }
  }

  // Fallback: find in static or custom data
  const product = getProductFromFiles(id);
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Remove internal _source field before sending
  const { _source, ...rest } = product;
  return NextResponse.json(rest);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const data = await req.json();
      const { images, pricingTiers, backingOptions, features, ...productData } = data;

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: id } }),
        prisma.pricingTier.deleteMany({ where: { productId: id } }),
        prisma.productBacking.deleteMany({ where: { productId: id } }),
        prisma.productFeature.deleteMany({ where: { productId: id } }),
      ]);

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          images: images?.length ? { create: images } : undefined,
          pricingTiers: pricingTiers?.length ? { create: pricingTiers } : undefined,
          backingOptions: backingOptions?.length
            ? { create: backingOptions.map((bid: string) => ({ backingId: bid })) }
            : undefined,
          features: features?.length
            ? { create: features.map((text: string, i: number) => ({ text, sortOrder: i })) }
            : undefined,
        },
        include: { images: true, pricingTiers: true, backingOptions: true, features: true },
      });
      return NextResponse.json(product);
    } catch (err) {
      console.error('Admin product update error:', err);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  }

  // JSON file fallback — save overrides
  try {
    const data = await req.json();
    const existing = getProductFromFiles(id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (existing._source === 'static') {
      // Save override for static product
      const overrides = readJsonFile<Record<string, Record<string, unknown>>>('product-overrides.json', {});
      // Remove fields that should not be in overrides
      const { _source: _s, ...overrideData } = { ...data };
      overrides[id] = overrideData;
      writeJsonFile('product-overrides.json', overrides);

      // Return merged product
      const staticProduct = staticProducts.find((p) => p.id === id)!;
      return NextResponse.json({ ...staticProduct, ...overrideData, id });
    } else {
      // Update custom product
      const customProducts = readJsonFile<Record<string, unknown>[]>('products-custom.json', []);
      const index = customProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      customProducts[index] = { ...customProducts[index], ...data, id };
      writeJsonFile('products-custom.json', customProducts);
      return NextResponse.json(customProducts[index]);
    }
  } catch (err) {
    console.error('Admin product update error (JSON):', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.product.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error('Admin product delete error:', err);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
  }

  // JSON file fallback
  const existing = getProductFromFiles(id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing._source === 'static') {
    // For static products, mark as deleted in overrides
    const overrides = readJsonFile<Record<string, Record<string, unknown>>>('product-overrides.json', {});
    overrides[id] = { ...overrides[id], _deleted: true, inStock: false };
    writeJsonFile('product-overrides.json', overrides);
  } else {
    // Remove custom product
    const customProducts = readJsonFile<Record<string, unknown>[]>('products-custom.json', []);
    const filtered = customProducts.filter((p) => p.id !== id);
    writeJsonFile('products-custom.json', filtered);
  }

  return NextResponse.json({ ok: true });
}
