import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductById } from '@/lib/products';
import DesignEditorLoader from '@/components/design/DesignEditorLoader';

const getProduct = getProductById;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `Design ${product.name}`,
    robots: { index: false, follow: true },
    alternates: { canonical: `/design/${product.id}` },
    description: `Design your custom ${product.name} tin tacker sign online. Upload artwork, add text, choose colors, and preview your ${product.dimensions.displaySize} sign in real time.`,
  };
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ productId: p.id }));
}

export default async function DesignEditorPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <DesignEditorLoader
      key={product.id}
      productId={product.id}
      productName={product.name}
      shape={product.shape}
      width={product.dimensions.width}
      height={product.dimensions.height}
      displaySize={product.dimensions.displaySize}
    />
  );
}
