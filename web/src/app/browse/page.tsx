'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BookCard from '@/components/BookCard';
import api from '@/lib/api';
import { BOARD_OPTIONS, CATEGORY_OPTIONS, boardLabel, categoryLabel } from '@/lib/labels';

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
  images?: { imageUrl: string }[];
}

interface Filters {
  board: string;
  classLevel: string;
  category: string;
  priceMin: string;
  priceMax: string;
  city: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const PER_PAGE = 9;
const CLASSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
const EMPTY_FILTERS: Filters = { board: '', classLevel: '', category: '', priceMin: '', priceMax: '', city: '' };

const LABEL = 'text-xs font-black uppercase tracking-[0.2em] text-muted-light mb-4 block';

function normalizeCategory(value: string | null): string {
  const v = (value || '').toUpperCase();
  return (CATEGORY_OPTIONS as string[]).includes(v) ? v : '';
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY_FILTERS,
    category: normalizeCategory(searchParams.get('category')),
  }));
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Re-seed when the URL changes (e.g. home search submitted again)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
    setDebouncedSearch(q);
    const category = normalizeCategory(searchParams.get('category'));
    setFilters((prev) => (prev.category === category ? prev : { ...prev, category }));
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
        setError(data.error || 'Could not load listings.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load listings. Please try again.');
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
    setFilters(EMPTY_FILTERS);
    setSearch('');
    setPage(1);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (debouncedSearch ? 1 : 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="container py-12 md:py-20">
      {/* Header */}
      <header className="mb-10 md:mb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="opacity-30" aria-hidden>/</span>
          <span>Marketplace</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">Browse Books</h1>
        <p className="text-muted font-medium text-lg max-w-lg mx-auto leading-relaxed">
          Find textbooks, study materials, and more from fellow parents in your neighborhood.
        </p>
      </header>

      {/* Search */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setDebouncedSearch(search.trim());
          setPage(1);
        }}
        className="max-w-2xl mx-auto mb-10"
      >
        <label htmlFor="browse-search" className="sr-only">Search listings by title</label>
        <input
          id="browse-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          className="w-full py-4 px-5 rounded-2xl font-bold"
        />
      </form>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="browse-filters"
            className="lg:hidden btn btn-outline w-full h-12 justify-between"
          >
            <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
            <span aria-hidden>{filtersOpen ? '▲' : '▼'}</span>
          </button>

          <div
            id="browse-filters"
            className={`card-flat p-6 md:p-8 lg:sticky lg:top-24 mt-4 lg:mt-0 ${filtersOpen ? 'block' : 'hidden'} lg:block`}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black tracking-tight">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-black uppercase tracking-[0.2em] text-accent hover:underline px-2 py-1"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="space-y-8">
              {/* Board */}
              <fieldset>
                <legend className={LABEL}>Board</legend>
                <div className="flex flex-wrap gap-2">
                  {BOARD_OPTIONS.map((board) => (
                    <button
                      key={board}
                      type="button"
                      aria-pressed={filters.board === board}
                      onClick={() => updateFilter('board', filters.board === board ? '' : board)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        filters.board === board
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-muted-extra-light text-muted hover:text-foreground'
                      }`}
                    >
                      {boardLabel(board)}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Category */}
              <fieldset>
                <legend className={LABEL}>Category</legend>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={filters.category === cat}
                      onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${
                        filters.category === cat
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'border-transparent hover:bg-muted-extra-light'
                      }`}
                    >
                      <span>{categoryLabel(cat)}</span>
                      {filters.category === cat && <span aria-hidden>✓</span>}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Class */}
              <div>
                <label htmlFor="filter-class" className={LABEL}>Class</label>
                <select
                  id="filter-class"
                  value={filters.classLevel}
                  onChange={(e) => updateFilter('classLevel', e.target.value)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm"
                >
                  <option value="">Any class</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <fieldset>
                <legend className={LABEL}>Price (&#8377;)</legend>
                <div className="flex items-center gap-2">
                  <label htmlFor="filter-min" className="sr-only">Minimum price</label>
                  <input
                    id="filter-min"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={filters.priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                    placeholder="Min"
                    className="w-full min-w-0 py-3 px-4 rounded-xl font-bold text-sm"
                  />
                  <span className="text-muted" aria-hidden>–</span>
                  <label htmlFor="filter-max" className="sr-only">Maximum price</label>
                  <input
                    id="filter-max"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={filters.priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                    placeholder="Max"
                    className="w-full min-w-0 py-3 px-4 rounded-xl font-bold text-sm"
                  />
                </div>
              </fieldset>

              {/* City */}
              <div>
                <label htmlFor="filter-city" className={LABEL}>City</label>
                <input
                  id="filter-city"
                  type="text"
                  value={filters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  placeholder="Search city..."
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-8 border-b border-card-border">
            <p className="text-muted font-medium" aria-live="polite">
              {loading ? 'Loading...' : error ? '' : `${total} listing${total === 1 ? '' : 's'} found`}
            </p>

            <div className="flex items-center gap-4">
              <label htmlFor="browse-sort" className="text-xs font-black uppercase tracking-[0.2em] text-muted-light">
                Sort by
              </label>
              <select
                id="browse-sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="py-2 px-4 rounded-xl font-bold text-sm cursor-pointer"
              >
                <option value="newest">Most Recent</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" aria-busy="true">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-flat overflow-hidden">
                  <div className="aspect-[4/5] skeleton rounded-none" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 skeleton" />
                    <div className="h-4 skeleton w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="card-flat p-10 text-center">
              <div className="text-5xl mb-4" aria-hidden>&#9888;&#65039;</div>
              <h3 className="text-xl font-black mb-2">Something went wrong</h3>
              <p className="text-muted mb-6">{error}</p>
              <button type="button" onClick={fetchListings} className="btn btn-primary h-12">
                Try again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6" aria-hidden>📚</div>
              <h3 className="text-2xl font-black mb-4">No listings found</h3>
              <p className="text-muted mb-8">Try adjusting your filters, or post a request and we&apos;ll notify you.</p>
              <div className="flex flex-wrap justify-center gap-3">
                {activeFilterCount > 0 && (
                  <button type="button" onClick={resetFilters} className="btn btn-outline">
                    Clear filters
                  </button>
                )}
                <Link href="/need" className="btn btn-primary">
                  Request a Book
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    imageUrl={listing.images?.[0]?.imageUrl}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 mt-12">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-outline h-12"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 font-bold">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-outline h-12"
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="container py-20">
          <div className="h-16 skeleton max-w-md mx-auto mb-6" />
          <div className="h-6 skeleton max-w-lg mx-auto" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
