import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { products as staticProducts } from '@/data/products';

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

  // Fallback: find in static data
  const product = staticProducts.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Product updates require a database connection.' },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import('@/lib/db');
    const { id } = await params;
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Product deletion requires a database connection.' },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import('@/lib/db');
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin product delete error:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
