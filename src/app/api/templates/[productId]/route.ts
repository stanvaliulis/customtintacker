import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/data/products';
import { generateTemplateSVG } from '@/lib/design/generate-template';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }

  const svg = generateTemplateSVG({
    shape: product.shape,
    widthInches: product.dimensions.width,
    heightInches: product.dimensions.height,
    displaySize: product.dimensions.displaySize,
    productId: product.id,
  });

  const filename = `template-${product.slug}.svg`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
