import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import DesignEditorLoader from '@/components/design/DesignEditorLoader';

function getProduct(productId: string) {
  return products.find((p) => p.id === productId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `Design ${product.name}`,
    description: `Design your custom ${product.name} tin tacker sign online. Upload artwork, add text, choose colors, and preview your ${product.dimensions.displaySize} sign in real time.`,
  };
}

export function generateStaticParams() {
  return products.map((p) => ({ productId: p.id }));
}

export default async function DesignEditorPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <DesignEditorLoader
      productId={product.id}
      productName={product.name}
      shape={product.shape}
      width={product.dimensions.width}
      height={product.dimensions.height}
      displaySize={product.dimensions.displaySize}
    />
  );
}
