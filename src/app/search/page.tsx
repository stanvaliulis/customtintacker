import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import { searchSite } from '@/lib/search';
import {
  searchTypeLabels,
  searchTypeSingular,
  searchTypeOrder,
  type SearchResultType,
} from '@/types/search';
import {
  Search,
  Package,
  FileText,
  Building2,
  LayoutGrid,
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Search | Custom Tin Tackers',
  description:
    'Search the Custom Tin Tackers catalog — embossed aluminum tin tacker signs, shapes, sizes, industries, and guides.',
  robots: { index: false, follow: true },
};


const typeIcons: Record<SearchResultType, typeof Package> = {
  product: Package,
  industry: Building2,
  article: FileText,
  page: LayoutGrid,
  gallery: ImageIcon,
};

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().slice(0, 100);
  const activeType = searchTypeOrder.includes(params.type as SearchResultType)
    ? (params.type as SearchResultType)
    : undefined;

  const allResults = query.length >= 2 ? await searchSite(query, { limit: 100 }) : [];
  const results = activeType ? allResults.filter((r) => r.type === activeType) : allResults;

  const counts = searchTypeOrder.map((type) => ({
    type,
    count: allResults.filter((r) => r.type === type).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero + search box */}
      <section className="relative bg-gray-950 overflow-hidden border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <Container className="relative py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-amber-400/80 font-medium tracking-widest uppercase text-sm">
                Search
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {query ? (
                <>
                  Results for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                    &ldquo;{query}&rdquo;
                  </span>
                </>
              ) : (
                'Search Custom Tin Tackers'
              )}
            </h1>

            <form action="/search" method="get" className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Try “circle tacker”, “12 inch”, or “brewery”"
                  aria-label="Search"
                  className="w-full rounded-lg border border-gray-800 bg-gray-900/80 pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors"
              >
                Search
              </button>
            </form>

            {query.length >= 2 && (
              <p className="mt-4 text-sm text-gray-500">
                {allResults.length} result{allResults.length !== 1 ? 's' : ''} across the site
              </p>
            )}
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container>
          {/* Type filters */}
          {counts.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                  !activeType
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium'
                    : 'text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                All ({allResults.length})
              </Link>
              {counts.map(({ type, count }) => (
                <Link
                  key={type}
                  href={`/search?q=${encodeURIComponent(query)}&type=${type}`}
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                    activeType === type
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium'
                      : 'text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {searchTypeLabels[type]} ({count})
                </Link>
              ))}
            </div>
          )}

          {/* Empty query */}
          {query.length < 2 && (
            <div className="max-w-xl">
              <p className="text-gray-400">
                Type at least two characters to search the catalog, industry pages, guides, and
                gallery.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Circle Tacker', 'Bottle Cap', '12 inch', 'Brewery', 'Street Sign', 'Templates'].map(
                  (term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1.5 rounded-full text-sm text-gray-300 bg-gray-900 border border-gray-800 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                    >
                      {term}
                    </Link>
                  ),
                )}
              </div>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && results.length === 0 && (
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-white">
                Nothing matched &ldquo;{query}&rdquo;
              </h2>
              <p className="mt-2 text-gray-400">
                Try a shape (circle, can, bottle cap), a size (12 inch), or an industry (brewery,
                bar, cannabis). If you need something custom, we make it.
              </p>
              <Link
                href="/quote"
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 transition-colors"
              >
                Request a Custom Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="grid gap-3">
              {results.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <Link
                    key={result.id}
                    href={result.url}
                    className="group flex items-start gap-4 p-4 sm:p-5 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-amber-500/50 hover:bg-gray-900 transition-all"
                  >
                    <span className="w-12 h-12 shrink-0 rounded-lg bg-gray-800 border border-gray-700/60 flex items-center justify-center overflow-hidden">
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt=""
                          width={48}
                          height={48}
                          className="object-contain w-full h-full p-1"
                        />
                      ) : (
                        <Icon className="w-5 h-5 text-amber-400/80" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {result.title}
                        </h2>
                        <span className="text-[11px] uppercase tracking-wider text-gray-500 border border-gray-800 rounded px-1.5 py-0.5">
                          {searchTypeSingular[result.type]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {result.description}
                      </p>
                      {result.meta && (
                        <p className="mt-1.5 text-xs text-amber-400/80">{result.meta}</p>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
