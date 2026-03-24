import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import AddToCartForm from '@/components/products/AddToCartForm';
import ProductImagePlaceholder from '@/components/products/ProductImagePlaceholder';
import { getAllProducts, getProductBySlug } from '@/lib/products';
import { formatPrice, getLowestPrice } from '@/lib/utils';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import {
  ChevronRight,
  CheckCircle,
  Shield,
  Truck,
  Flag,
  Ruler,
  Printer,
  CircleDot,
  Package,
  Clock,
  Star,
} from 'lucide-react';

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const shapeLabel = product.shape.replace(/-/g, ' ');
  const shapeTitleCase = shapeLabel.charAt(0).toUpperCase() + shapeLabel.slice(1);
  const sizeLabel = product.dimensions.displaySize;
  const title = `${product.name} — ${sizeLabel} ${shapeTitleCase} Tin Tacker | Embossed Aluminum Sign`;
  const description = `${product.shortDescription} Order this custom ${sizeLabel} ${shapeLabel} tin tacker sign made in the USA from recycled embossed aluminum by Interstate Graphics. Bulk tin tacker pricing from ${product.minimumOrder} units. Ideal for breweries, bars, taprooms, restaurants, and brand promotions.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      'tin tacker',
      'tin tackers',
      'tin tacker sign',
      `${sizeLabel} tin tacker`,
      `${shapeLabel} tin tacker`,
      `${sizeLabel} embossed aluminum sign`,
      `custom ${shapeLabel} tin tacker`,
      `custom ${shapeLabel} sign`,
      'embossed aluminum sign',
      'custom bar sign',
      'brewery sign',
      'beer sign',
      'promotional tin tacker',
      'made in USA tin tacker',
      'recycled aluminum sign',
      'bulk tin tackers',
      'tin tacker pricing',
      'order tin tackers',
    ],
    openGraph: {
      title,
      description,
      url: `https://customtintackers.com/products/${slug}`,
      type: 'website',
      images: product.images.length > 0
        ? [{ url: product.images[0].startsWith('http') ? product.images[0] : `https://customtintackers.com${product.images[0]}`, width: 800, height: 800, alt: `${product.name} — Custom ${shapeTitleCase} Tin Tacker Sign` }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://customtintackers.com/products/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const lowestPrice = getLowestPrice(product.pricingTiers);
  const firstTierPrice = product.pricingTiers[0]?.pricePerUnit ?? lowestPrice;
  const maxSavings = Math.round(((firstTierPrice - lowestPrice) / firstTierPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd data={getProductSchema(product)} />
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Products', url: `${siteConfig.url}/products` },
          { name: product.name, url: `${siteConfig.url}/products/${product.slug}` },
        ])}
      />
      {/* Breadcrumbs */}
      <div className="border-b border-gray-800/50 bg-gray-950">
        <Container>
          <nav className="py-4 flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <Link href="/products" className="text-gray-500 hover:text-gray-300 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-amber-400 font-medium">{product.name}</span>
          </nav>
        </Container>
      </div>

      {/* Main Product Section */}
      <section className="py-10 sm:py-14">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800/50 bg-gray-900 relative">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-6"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/30 p-8">
                    <div className="w-full h-[70%]">
                      <ProductImagePlaceholder
                        shape={product.shape}
                        productName={product.name}
                        label={product.dimensions.displaySize}
                      />
                    </div>
                    <div className="mt-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-sm text-amber-400 font-semibold tracking-wide uppercase">Image Coming Soon</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail gallery if multiple images */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-800/50 bg-gray-900 relative"
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick info badges below image */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl border border-gray-800/50 px-3 py-3">
                  <Flag className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-medium">Made in USA</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl border border-gray-800/50 px-3 py-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-medium">Premium Quality</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl border border-gray-800/50 px-3 py-3">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-gray-300 font-medium">{product.leadTimeDays}-Day Lead</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700/50">
                  {product.dimensions.displaySize}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700/50 capitalize">
                  {product.shape}
                </span>
                {product.featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    <Star className="w-3 h-3" />
                    Popular
                  </span>
                )}
              </div>

              {/* Title and Price */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                  From {formatPrice(lowestPrice)}/unit
                </span>
                {maxSavings > 0 && (
                  <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                    Save up to {maxSavings}%
                  </span>
                )}
              </div>

              <p className="text-gray-400 leading-relaxed mb-8 text-base">
                {product.longDescription}
              </p>

              {/* Design Online CTA */}
              <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Design your sign online</p>
                    <p className="text-sm text-gray-400 mt-0.5">Add text, upload your logo, preview instantly</p>
                  </div>
                  <Link
                    href={`/design/${product.id}`}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Design Online
                  </Link>
                </div>
              </div>

              {/* Preview Artwork Mockup CTA */}
              <div className="mb-8 p-4 rounded-xl border border-gray-700/50 bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Preview your artwork on this sign</p>
                    <p className="text-sm text-gray-400 mt-0.5">Upload your logo and see a realistic mockup in seconds</p>
                  </div>
                  <Link
                    href={`/mockup?shape=${product.shape}`}
                    className="shrink-0 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Preview Mockup
                  </Link>
                </div>
              </div>

              {/* Add to Cart Form (includes pricing table, backing, quantity) */}
              <AddToCartForm product={product} />

              {/* Features */}
              <div className="mt-10 pt-8 border-t border-gray-800/50">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  Features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-3 text-sm bg-gray-900/30 rounded-lg p-3 border border-gray-800/30"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div className="mt-8 pt-8 border-t border-gray-800/50">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-amber-400" />
                  Specifications
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <SpecItem
                    icon={<Package className="w-4 h-4" />}
                    label="Material"
                    value={product.metadata.material}
                  />
                  <SpecItem
                    icon={<Printer className="w-4 h-4" />}
                    label="Print Method"
                    value={product.metadata.printMethod}
                  />
                  <SpecItem
                    icon={<CircleDot className="w-4 h-4" />}
                    label="Mounting Holes"
                    value={String(product.metadata.mountingHoles)}
                  />
                  <SpecItem
                    icon={<Shield className="w-4 h-4" />}
                    label="Packaging"
                    value={product.metadata.shrinkWrapped ? 'Shrink-wrapped' : 'Bulk'}
                  />
                  <SpecItem
                    icon={<Star className="w-4 h-4" />}
                    label="Min. Order"
                    value={`${product.minimumOrder} units`}
                  />
                  <SpecItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Lead Time"
                    value={`${product.leadTimeDays} business days`}
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-4">
      <div className="flex items-center gap-2 text-amber-400/60 mb-1.5">
        {icon}
        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
      </div>
      <dd className="font-semibold text-white text-sm">{value}</dd>
    </div>
  );
}
