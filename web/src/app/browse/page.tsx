'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import api from '@/lib/api';

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

type SortOption = 'recent' | 'price_asc' | 'price_desc';

const BOARDS = ['CBSE', 'ICSE', 'IB', 'State', 'IGCSE'] as const;
const PER_PAGE = 9;

export default function BrowsePage() {
  const [filters, setFilters] = useState<Filters>({
    board: '',
    classLevel: '',
    category: '',
    priceMin: '',
    priceMax: '',
    city: '',
  });
  const [sort, setSort] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', PER_PAGE.toString());
      if (filters.board) params.append('board', filters.board);
      if (filters.city) params.append('city', filters.city);
      if (filters.category) params.append('category', filters.category);
      
      const { data } = await api.get(`/listings?${params.toString()}`);
      if (data.success) {
        setListings(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({ board: '', classLevel: '', category: '', priceMin: '', priceMax: '', city: '' });
    setPage(1);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="container py-20">
      {/* Header */}
      <header className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="opacity-30">/</span>
          <span>Marketplace</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter">
          Browse Books
        </h1>
        <p className="text-muted font-medium text-lg max-w-lg mx-auto leading-relaxed">
          Find textbooks, study materials, and more from fellow parents in your neighborhood.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="card-premium p-8 sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black tracking-tight">Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="space-y-8">
              {/* Board */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light mb-4">
                  Board
                </h4>
                <div className="flex flex-wrap gap-2">
                  {BOARDS.map((board) => (
                    <button
                      key={board}
                      onClick={() => updateFilter('board', filters.board === board ? '' : board)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        filters.board === board
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-muted-extra-light text-muted hover:bg-muted-light'
                      }`}
                    >
                      {board}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light mb-4">
                  Category
                </h4>
                <div className="space-y-2">
                  {['Book', 'Stationery'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                        filters.category === cat
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'hover:bg-muted-extra-light'
                      }`}
                    >
                      <span>{cat}</span>
                      {filters.category === cat && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light mb-4">
                  City
                </h4>
                <input
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
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-8 border-b border-card-border">
            <p className="text-muted font-medium">
              {loading ? 'Loading...' : `${total} listings found`}
            </p>

            <div className="flex items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="py-2 px-4 rounded-xl font-bold text-sm appearance-none cursor-pointer bg-muted-extra-light"
              >
                <option value="recent">Most Recent</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-premium overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-muted-extra-light" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted-extra-light rounded" />
                    <div className="h-4 bg-muted-extra-light rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-black mb-4">No listings found</h3>
              <p className="text-muted mb-8">Try adjusting your filters or check back later.</p>
              <Link href="/sell" className="btn btn-primary">
                Sell Your Books
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id}>
                    <BookCard
                      id={listing.id}
                      title={listing.title}
                      sellingPrice={listing.sellingPrice}
                      buyingPrice={listing.buyingPrice}
                      condition={listing.condition}
                      category={listing.category}
                      city={listing.city}
                      imageUrl={listing.images?.[0]?.imageUrl ? `${listing.images[0].imageUrl}` : undefined}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 font-bold">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-outline disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
