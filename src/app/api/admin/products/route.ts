import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { isDatabaseConfigured } from '@/lib/env';
import { products as staticProducts } from '@/data/products';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      const { prisma } = await import('@/lib/db');
      const products = await prisma.product.findMany({
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          pricingTiers: { orderBy: { minQuantity: 'asc' } },
          backingOptions: true,
          features: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { sortOrder: 'asc' },
      });
      return NextResponse.json(products);
    } catch (err) {
      console.error('Admin products DB error:', err);
    }
  }

  // Fallback: return static product data
  return NextResponse.json(staticProducts);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Product creation requires a database connection.' },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import('@/lib/db');
    const data = await req.json();
    const { images, pricingTiers, backingOptions, features, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: images?.length ? { create: images } : undefined,
        pricingTiers: pricingTiers?.length ? { create: pricingTiers } : undefined,
        backingOptions: backingOptions?.length
          ? { create: backingOptions.map((id: string) => ({ backingId: id })) }
          : undefined,
        features: features?.length
          ? { create: features.map((text: string, i: number) => ({ text, sortOrder: i })) }
          : undefined,
      },
      include: {
        images: true,
        pricingTiers: true,
        backingOptions: true,
        features: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error('Admin product create error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
