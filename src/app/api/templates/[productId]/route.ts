import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/data/products';
import { generateTemplateSVG } from '@/lib/design/generate-template';
import { generateTemplatePDF } from '@/lib/design/generate-template-pdf';

export async function GET(
  request: NextRequest,
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

  const options = {
    shape: product.shape,
    widthInches: product.dimensions.width,
    heightInches: product.dimensions.height,
    displaySize: product.dimensions.displaySize,
    productId: product.id,
  };

  const requested = request.nextUrl.searchParams.get('format');
  const format = requested === 'pdf' || requested === 'png' ? requested : 'svg';
  const cache = 'public, max-age=86400, s-maxage=86400';

  // 300 DPI raster, for anyone laying artwork out in Photoshop rather than a
  // vector tool. The SVG is authored at 72 PPI, so rasterising at 300 DPI
  // yields exactly 300 pixels per physical inch.
  if (format === 'png') {
    const sharp = (await import('sharp')).default;
    const png = await sharp(Buffer.from(generateTemplateSVG(options)), { density: 300 })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="template-${product.slug}-300dpi.png"`,
        'Cache-Control': cache,
      },
    });
  }

  if (format === 'pdf') {
    const pdf = await generateTemplatePDF(options);
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="template-${product.slug}.pdf"`,
        'Cache-Control': cache,
      },
    });
  }

  const svg = generateTemplateSVG(options);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="template-${product.slug}.svg"`,
      'Cache-Control': cache,
    },
  });
}
