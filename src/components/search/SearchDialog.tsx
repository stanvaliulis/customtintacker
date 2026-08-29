'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  X,
  Loader2,
  Package,
  FileText,
  Building2,
  Image as ImageIcon,
  LayoutGrid,
  ArrowRight,
  Clock,
  CornerDownLeft,
} from 'lucide-react';
import type { SearchResult, SearchResultType } from '@/types/search';
import { searchTypeLabels, searchTypeOrder } from '@/types/search';

const RECENT_KEY = 'ctt-recent-searches';
const MAX_RECENT = 5;

const typeIcons: Record<SearchResultType, typeof Package> = {
  product: Package,
  industry: Building2,
  article: FileText,
  page: LayoutGrid,
  gallery: ImageIcon,
};

const quickLinks = [
  { label: 'All Products', href: '/products' },
  { label: 'Get a Quote', href: '/quote' },
  { label: 'AI Designer', href: '/ai-designer' },
  { label: 'Brewery Signs', href: '/brewery-signs' },
  { label: 'Request Samples', href: '/samples' },
  { label: 'Distributor Pricing', href: '/distributors' },
];

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  // ── Load recent searches once the dialog opens ───────────────────
  useEffect(() => {
    if (!open) return;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      // localStorage unavailable — recent searches are optional
    }
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, [open]);

  // ── Lock body scroll while open ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // ── Debounced fetch ──────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Search request failed');
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const saveRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    try {
      const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore write failures
    }
  }, [recent]);

  const go = useCallback(
    (url: string) => {
      saveRecent(query);
      onClose();
      setQuery('');
      router.push(url);
    },
    [onClose, query, router, saveRecent],
  );

  const seeAll = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    go(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [go, query]);

  // Flat list drives keyboard navigation; last row is "see all results".
  const navigable = useMemo(
    () => [...results.map((r) => r.url), ...(results.length > 0 ? ['__all__'] : [])],
    [results],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (navigable.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        seeAll();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % navigable.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + navigable.length) % navigable.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = navigable[activeIndex];
      if (!target || target === '__all__') seeAll();
      else go(target);
    }
  }

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultType, { result: SearchResult; index: number }[]>();
    results.forEach((result, index) => {
      const bucket = map.get(result.type) ?? [];
      bucket.push({ result, index });
      map.set(result.type, bucket);
    });
    return searchTypeOrder
      .filter((t) => map.has(t))
      .map((t) => ({ type: t, items: map.get(t)! }));
  }, [results]);

  if (!open) return null;

  const trimmed = query.trim();
  const showEmptyState = trimmed.length < 2;
  const noResults = !loading && trimmed.length >= 2 && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search Custom Tin Tackers"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 sm:px-5 border-b border-gray-800">
          {loading ? (
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-gray-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, shapes, industries, guides…"
            aria-label="Search"
            className="flex-1 bg-transparent py-4 text-base text-white placeholder:text-gray-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:block text-[11px] font-medium text-gray-500 border border-gray-700 rounded px-1.5 py-0.5 hover:text-gray-300 hover:border-gray-600 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {showEmptyState && (
            <div className="p-4 sm:p-5 space-y-5">
              {recent.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Recent
                  </p>
                  <div className="space-y-0.5">
                    {recent.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                      >
                        <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Popular
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((link) => (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => go(link.href)}
                      className="px-3 py-1.5 rounded-full text-sm text-gray-300 bg-gray-800/70 border border-gray-700/60 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {noResults && (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-300 font-medium">
                No matches for &ldquo;{trimmed}&rdquo;
              </p>
              <p className="mt-1.5 text-sm text-gray-500">
                Try a shape (&ldquo;circle&rdquo;), a size (&ldquo;12 inch&rdquo;), or an industry
                (&ldquo;brewery&rdquo;).
              </p>
              <button
                type="button"
                onClick={() => go('/quote')}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                Ask us for a custom quote
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {grouped.map((group) => {
            const Icon = typeIcons[group.type];
            return (
              <div key={group.type} className="py-2">
                <p className="px-4 sm:px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {searchTypeLabels[group.type]}
                </p>
                {group.items.map(({ result, index }) => (
                  <button
                    key={result.id}
                    type="button"
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(result.url)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 text-left transition-colors ${
                      index === activeIndex ? 'bg-gray-800' : 'hover:bg-gray-800/60'
                    }`}
                  >
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-gray-800 border border-gray-700/60 flex items-center justify-center overflow-hidden">
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt=""
                          width={36}
                          height={36}
                          className="object-contain w-full h-full p-1"
                        />
                      ) : (
                        <Icon className="w-4 h-4 text-amber-400/80" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white truncate">
                        {result.title}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {result.meta ?? result.description}
                      </span>
                    </span>
                    {index === activeIndex && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}

          {results.length > 0 && (
            <button
              type="button"
              data-active={activeIndex === results.length}
              onMouseEnter={() => setActiveIndex(results.length)}
              onClick={seeAll}
              className={`w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-gray-800 text-sm font-medium transition-colors ${
                activeIndex === results.length
                  ? 'bg-gray-800 text-amber-400'
                  : 'text-amber-400/90 hover:bg-gray-800/60'
              }`}
            >
              <span>See all results for &ldquo;{trimmed}&rdquo;</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer hints */}
        <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-t border-gray-800 bg-gray-900/80 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 font-sans">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 font-sans">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 font-sans">↵</kbd>
            to open
          </span>
          <span className="ml-auto">Made in the USA by Interstate Graphics</span>
        </div>
      </div>
    </div>
  );
}
