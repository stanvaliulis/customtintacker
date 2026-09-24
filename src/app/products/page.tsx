import { Suspense } from 'react';
import { Metadata } from 'next';
import Container from '@/components/ui/Container';
import ProductFilters from '@/components/products/ProductFilters';
import ProductGrid from '@/components/products/ProductGrid';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbSchema } from '@/lib/structured-data';
import { siteConfig } from '@/data/siteConfig';
import { getAllProducts } from '@/lib/products';
import { Package, Sparkles, ChevronRight } from 'lucide-react';
import { catalog, getMaterial, getSubcategory, getMaterialGroup, getSubcategoryLabel } from '@/data/categories';
import type { Product } from '@/types/product';
import Link from 'next/link';

export const revalidate = 3600; // revalidate every hour

export const metadata: Metadata = {
  title: 'Tin Tacker Signs — All Shapes & Sizes | Custom Embossed Aluminum Tin Tackers',
  description:
    'Browse our full catalog of custom embossed aluminum tin tacker signs. Square, circle, can shape, bottle cap, street sign, arrow, license plate, and custom die-cut tin tackers. Factory-direct bulk pricing from $3.50/unit. Made in USA by Interstate Graphics, Machesney Park, IL. Order tin tackers for breweries, bars, and brand promotions.',
  keywords: [
    'tin tacker signs',
    'tin tackers catalog',
    'embossed aluminum signs',
    'square tin tackers',
    'circle tin tackers',
    'can shape tin tackers',
    'bottle cap tin tacker',
    'street sign tin tacker',
    'arrow tin tackers',
    'custom die-cut tin tacker',
    'license plate tin tacker',
    'bulk tin tacker pricing',
    'buy tin tackers',
    'order tin tackers',
    'tin tacker shapes',
    'tin tacker sizes',
  ],
  openGraph: {
    title: 'Tin Tacker Signs — All Shapes & Sizes | Custom Embossed Aluminum Tin Tackers',
    description:
      'Premium embossed aluminum tin tacker signs in every shape and size. Square, circle, can shape, bottle cap, arrow, and custom die-cut tin tackers. Factory-direct bulk pricing. Made in the USA by Interstate Graphics.',
    url: 'https://customtintackers.com/products',
  },
  alternates: {
    canonical: 'https://customtintackers.com/products',
  },
};

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const shapeFilter = params.shape || '';
  const categoryFilter = params.category || '';
  const materialFilter = getMaterialGroup(params.material || '') ? params.material! : '';
  const subFilter = materialFilter && getSubcategoryLabel(materialFilter, params.sub || '') ? params.sub! : '';

  const allProducts = await getAllProducts();
  allProducts.sort((a, b) => a.sortOrder - b.sortOrder);

  // Counts for the sidebar
  const counts: Record<string, number> = { all: allProducts.length };
  for (const p of allProducts) {
    const m = getMaterial(p);
    const key = `${m}/${getSubcategory(p)}`;
    counts[m] = (counts[m] ?? 0) + 1;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  let products = allProducts;
  // Older links (?shape= / ?category=) keep working
  if (shapeFilter) products = products.filter((p) => p.shape === shapeFilter);
  if (categoryFilter) products = products.filter((p) => p.category === categoryFilter);
  if (materialFilter) products = products.filter((p) => getMaterial(p) === materialFilter);
  if (subFilter) products = products.filter((p) => getSubcategory(p) === subFilter);

  // Browsing (no sub category picked): show products in sub category sections
  const grouped = !subFilter && !shapeFilter && !categoryFilter;
  const sections: { id: string; material: string; title: string; description: string; items: Product[] }[] = [];
  if (grouped) {
    for (const group of catalog) {
      if (materialFilter && group.value !== materialFilter) continue;
      for (const sc of group.subcategories) {
        const items = products.filter((p) => getMaterial(p) === group.value && getSubcategory(p) === sc.value);
        if (items.length) {
          sections.push({ id: `${group.value}-${sc.value}`, material: group.label, title: sc.label, description: sc.description, items });
        }
      }
    }
  }
  const heading = subFilter
    ? `${getMaterialGroup(materialFilter)!.label} · ${getSubcategoryLabel(materialFilter, subFilter)}`
    : materialFilter
      ? getMaterialGroup(materialFilter)!.label
      : '';

  return (
    <div className="min-h-screen bg-gray-950">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Products', url: `${siteConfig.url}/products` },
        ])}
      />
      {/* Dark Hero Header */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />

        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
          }}
        />

        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                Product Catalog
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Products
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Premium embossed aluminum tin tacker signs built to make your brand impossible to ignore. Choose from squares, circles, can shapes, bottle caps, and fully custom die-cuts.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500/60" />
                {products.length} product{products.length !== 1 ? 's' : ''} available
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Factory-direct pricing</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Made in USA</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Product Grid Section */}
      <section className="py-10 sm:py-14">
        <Container>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-60 shrink-0">
              <div className="md:sticky md:top-24 bg-gray-900/50 rounded-xl border border-gray-800/50 p-5">
                <Suspense>
                  <ProductFilters counts={counts} />
                </Suspense>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              {heading && (
                <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500" aria-label="Category">
                  <Link href="/products" className="hover:text-gray-300">All Products</Link>
                  {materialFilter && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <Link href={`/products?material=${materialFilter}`} className={subFilter ? 'hover:text-gray-300' : 'text-amber-400'}>
                        {getMaterialGroup(materialFilter)!.label}
                      </Link>
                    </>
                  )}
                  {subFilter && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span className="text-amber-400">{getSubcategoryLabel(materialFilter, subFilter)}</span>
                    </>
                  )}
                </nav>
              )}
              {grouped ? (
                <div className="space-y-14">
                  {sections.map((sec) => (
                    <section key={sec.id} id={sec.id} className="scroll-mt-24">
                      <div className="mb-5 flex items-end justify-between gap-4 border-b border-gray-800/60 pb-3">
                        <div>
                          {!materialFilter && (
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">{sec.material}</p>
                          )}
                          <h2 className="text-2xl font-bold text-white">{sec.title}</h2>
                          <p className="mt-1 text-sm text-gray-500">{sec.description}</p>
                        </div>
                        <span className="shrink-0 text-sm text-gray-500">
                          {sec.items.length} product{sec.items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ProductGrid products={sec.items} />
                    </section>
                  ))}
                  {sections.length === 0 && <ProductGrid products={[]} />}
                </div>
              ) : (
                <>
                  {heading && <h2 className="mb-5 text-2xl font-bold text-white">{heading}</h2>}
                  <ProductGrid products={products} />
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
