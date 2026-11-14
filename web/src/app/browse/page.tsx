'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import BookCard from '@/components/BookCard';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Select from '@/components/ui/Select';
import BrowseFilters, {
  EMPTY_BROWSE_FILTERS,
  type BrowseFilterValues,
} from '@/components/listing/BrowseFilters';
import FilterSheet from '@/components/listing/FilterSheet';
import { formatRupees } from '@/components/listing/format';
import api from '@/lib/api';
import { CATEGORY_OPTIONS, boardLabel } from '@/lib/labels';

interface Listing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  board?: string;
  class?: number;
  school?: { name: string } | null;
  images?: { imageUrl: string }[];
}

type Filters = BrowseFilterValues;
type SortOption = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

const PER_PAGE = 9;

const BOARD_VALUES = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'];

/** Filters that can arrive in the URL (home hero sentence, category links). */
function urlFilters(sp: URLSearchParams | ReturnType<typeof useSearchParams>) {
  const cls = Number(sp.get('class'));
  const board = (sp.get('board') || '').toUpperCase();
  return {
    category: normalizeCategory(sp.get('category')),
    classLevel: Number.isInteger(cls) && cls >= 1 && cls <= 12 ? String(cls) : '',
    board: BOARD_VALUES.includes(board) ? board : '',
    city: (sp.get('city') || '').trim(),
  };
}

function normalizeCategory(value: string | null): string {
  const v = (value || '').toUpperCase();
  return (CATEGORY_OPTIONS as string[]).includes(v) ? v : '';
}

/** "No Class 6 CBSE textbooks in Bangalore yet" from whatever is active. */
function emptyHeadline(filters: Filters, search: string): string {
  const noun =
    filters.category === 'STATIONERY' ? 'stationery' : filters.category === 'BOOK' ? 'textbooks' : 'books';
  const parts = [
    filters.classLevel ? `Class ${filters.classLevel}` : '',
    filters.board ? boardLabel(filters.board) : '',
    noun,
  ].filter(Boolean);
  let line = `No ${parts.join(' ')}`;
  if (search) line += ` matching “${search}”`;
  if (filters.city.trim()) line += ` in ${filters.city.trim()}`;
  if (filters.priceMax) line += ` under ${formatRupees(Number(filters.priceMax))}`;
  return `${line} yet`;
}

function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_BROWSE_FILTERS,
    ...urlFilters(searchParams),
  }));
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Re-seed when the URL changes (e.g. home search submitted again)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
    setDebouncedSearch(q);
    const fromUrl = urlFilters(searchParams);
    setFilters((prev) => ({ ...prev, ...fromUrl }));
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: PER_PAGE.toString(),
        sortBy: sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.board) params.board = filters.board;
      if (filters.city.trim()) params.city = filters.city.trim();
      if (filters.category) params.category = filters.category;
      if (filters.classLevel) params.class = filters.classLevel;
      if (filters.priceMin) params.minPrice = filters.priceMin;
      if (filters.priceMax) params.maxPrice = filters.priceMax;

      const { data } = await api.get('/listings', { params });
      if (data.success) {
        setListings(data.data || []);
        setTotal(data.pagination?.total || 0);
      } else {
        setError(data.error || 'Listings didn’t load. Try again in a moment.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'We could not reach Sybrary. Check your connection and try again.');
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort, debouncedSearch]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_BROWSE_FILTERS);
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }, []);

  const goToPage = (p: number) => {
    setPage(p);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Active filters as removable chips
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (debouncedSearch)
    activeChips.push({
      key: 'q',
      label: `“${debouncedSearch}”`,
      clear: () => {
        setSearch('');
        setDebouncedSearch('');
        setPage(1);
      },
    });
  if (filters.category)
    activeChips.push({
      key: 'category',
      label: filters.category === 'STATIONERY' ? 'Stationery' : 'Textbooks',
      clear: () => updateFilter('category', ''),
    });
  if (filters.classLevel)
    activeChips.push({ key: 'class', label: `Class ${filters.classLevel}`, clear: () => updateFilter('classLevel', '') });
  if (filters.board)
    activeChips.push({ key: 'board', label: boardLabel(filters.board), clear: () => updateFilter('board', '') });
  if (filters.city.trim())
    activeChips.push({ key: 'city', label: filters.city.trim(), clear: () => updateFilter('city', '') });
  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? formatRupees(Number(filters.priceMin)) : '';
    const max = filters.priceMax ? formatRupees(Number(filters.priceMax)) : '';
    const label = min && max ? `${min} to ${max}` : min ? `From ${min}` : `Under ${max}`;
    activeChips.push({
      key: 'price',
      label,
      clear: () => {
        updateFilter('priceMin', '');
        updateFilter('priceMax', '');
      },
    });
  }

  const activeCount = activeChips.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const countLabel = `${total.toLocaleString('en-IN')} ${total === 1 ? 'listing' : 'listings'}`;

  return (
    <div className="container py-10 md:py-14">
      {/* Page header */}
      <header className="mb-8 flex flex-col gap-5 md:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="mb-3 text-4xl md:text-5xl">Browse books</h1>
          <p className="text-muted">
            School textbooks and stationery from other parents, ready for another term. Seller contact details stay private
            until they accept your request.
          </p>
        </div>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setDebouncedSearch(search.trim());
            setPage(1);
          }}
          className="relative w-full lg:max-w-sm"
        >
          <label htmlFor="browse-search" className="sr-only">
            Search listings by title
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="browse-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, like Science Class 7"
            className="h-12 w-full pl-12"
          />
        </form>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Desktop filter rail */}
        <aside className="hidden w-[300px] flex-shrink-0 lg:sticky lg:top-24 lg:block" aria-label="Filters">
          <div className="card-flat p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Filters</h2>
              {activeCount > 0 && (
                <button type="button" onClick={resetFilters} className="btn btn-ghost btn-sm -mr-2">
                  Clear all
                </button>
              )}
            </div>
            <BrowseFilters values={filters} onChange={updateFilter} idPrefix="rail" />
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0 flex-1" aria-labelledby="results-heading">
          <div ref={resultsRef} className="scroll-mt-24" />

          {/* Results header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="text-2xl font-extrabold" aria-live="polite">
              {loading ? (
                <span className="text-muted">Finding books&hellip;</span>
              ) : error ? (
                'Results'
              ) : (
                countLabel
              )}
            </h2>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="btn btn-outline btn-sm flex-1 sm:flex-none lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filters
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-edge bg-sun px-1.5 text-xs font-bold text-ink">
                    {activeCount}
                  </span>
                )}
              </button>
              <label htmlFor="browse-sort" className="sr-only">
                Sort listings
              </label>
              <Select
                id="browse-sort"
                value={sort}
                onChange={(value) => {
                  setSort(value as SortOption);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
                align="right"
                className="flex-1 sm:w-52 sm:flex-none"
                buttonClassName="h-10 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="chip shrink-0"
                  data-active="true"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  {chip.label}
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 px-2 text-sm font-semibold text-primary underline decoration-2 underline-offset-4 min-h-10"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading listings">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-flat overflow-hidden">
                  <div className="skeleton aspect-[4/3] rounded-none border-b-2 border-card-border" />
                  <div className="space-y-3 p-4">
                    <div className="skeleton h-5 w-4/5" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-16 rounded-full" />
                      <div className="skeleton h-6 w-14 rounded-full" />
                      <div className="skeleton h-6 w-24 rounded-full" />
                    </div>
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState size="lg" title="Listings didn’t load" message={error} onRetry={fetchListings} />
          ) : listings.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={activeCount > 0 ? emptyHeadline(filters, debouncedSearch) : 'No books listed yet'}
              description="Tell us what you need and we’ll let you know when a parent lists it."
              actions={
                <>
                  <Link href="/need" className="btn btn-primary">
                    Request a book
                  </Link>
                  {activeCount > 0 && (
                    <button type="button" onClick={resetFilters} className="btn btn-outline">
                      Clear filters
                    </button>
                  )}
                </>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <BookCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    sellingPrice={listing.sellingPrice}
                    buyingPrice={listing.buyingPrice}
                    condition={listing.condition}
                    category={listing.category}
                    city={listing.city}
                    board={listing.board}
                    classLevel={listing.class}
                    schoolName={listing.school?.name}
                    imageUrl={listing.images?.[0]?.imageUrl}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Pages" className="mt-10 flex items-center justify-between gap-3 border-t-2 border-edge pt-6">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn btn-outline btn-sm"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Previous
                  </button>

                  <ol className="hidden items-center gap-1.5 sm:flex">
                    {pageWindow(page, totalPages).map((p, i) =>
                      p === 'gap' ? (
                        <li key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
                          &hellip;
                        </li>
                      ) : (
                        <li key={p}>
                          <button
                            type="button"
                            onClick={() => goToPage(p)}
                            aria-current={p === page ? 'page' : undefined}
                            aria-label={`Page ${p}`}
                            className={`btn btn-sm w-10 px-0 ${
                              p === page ? 'bg-foreground text-background' : 'btn-ghost'
                            }`}
                          >
                            {p}
                          </button>
                        </li>
                      ),
                    )}
                  </ol>
                  <p className="text-sm font-semibold text-muted sm:hidden">
                    Page {page} of {totalPages}
                  </p>

                  <button
                    type="button"
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* Phone filter sheet */}
      <FilterSheet
        open={sheetOpen}
        onClose={closeSheet}
        title="Filters"
        footer={
          <div className="flex gap-3">
            {activeCount > 0 && (
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                Clear all
              </button>
            )}
            <button type="button" onClick={closeSheet} className="btn btn-primary flex-1">
              {loading ? 'Show results' : `Show ${countLabel}`}
            </button>
          </div>
        }
      >
        <BrowseFilters values={filters} onChange={updateFilter} idPrefix="sheet" />
      </FilterSheet>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="container py-10 md:py-14">
          <div className="skeleton mb-4 h-12 max-w-xs" />
          <div className="skeleton h-5 max-w-lg" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
