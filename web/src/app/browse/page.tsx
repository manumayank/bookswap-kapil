'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookCardListing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  imageUrl?: string;
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

/* ------------------------------------------------------------------ */
/*  Mock data (swap with API later)                                    */
/* ------------------------------------------------------------------ */

const MOCK_LISTINGS: BookCardListing[] = [
  { id: '1',  title: 'Mathematics Class 10 - NCERT',               sellingPrice: 150, buyingPrice: 350, condition: 'Like New',   category: 'Book',       city: 'New Delhi' },
  { id: '2',  title: 'Evergreen Science Lab Manual Class 9',       sellingPrice: 200, buyingPrice: 420, condition: 'Good',        category: 'Book',       city: 'New Delhi' },
  { id: '3',  title: 'Oxford Dictionary of English',               sellingPrice: 450, buyingPrice: 850, condition: 'New',         category: 'Book',       city: 'Mumbai' },
  { id: '4',  title: 'RD Sharma Class 11 Vol 1 & 2',              sellingPrice: 600, buyingPrice: 1100,condition: 'Good',        category: 'Book',       city: 'Bangalore' },
  { id: '5',  title: 'Chemistry Vol 2 - Pradeep Publication',      sellingPrice: 300, buyingPrice: 550, condition: 'Fair',        category: 'Book',       city: 'New Delhi' },
  { id: '6',  title: 'Geometry Box & Premium Pen Set',             sellingPrice: 100, buyingPrice: 250, condition: 'New',         category: 'Stationery', city: 'New Delhi' },
  { id: '7',  title: 'Social Science Class 8 - NCERT',            sellingPrice: 120, buyingPrice: 280, condition: 'Like New',   category: 'Book',       city: 'Pune' },
  { id: '8',  title: 'English Grammar & Composition - Wren & Martin', sellingPrice: 220, buyingPrice: 400, condition: 'Good',   category: 'Book',       city: 'Mumbai' },
  { id: '9',  title: 'Art & Craft Supplies Kit Class 5',          sellingPrice: 180, buyingPrice: 350, condition: 'New',         category: 'Stationery', city: 'Bangalore' },
  { id: '10', title: 'Physics NCERT Class 12',                     sellingPrice: 160, buyingPrice: 320, condition: 'Like New',   category: 'Book',       city: 'New Delhi' },
  { id: '11', title: 'Biology Pradeep Class 11',                   sellingPrice: 500, buyingPrice: 900, condition: 'Good',        category: 'Book',       city: 'Hyderabad' },
  { id: '12', title: 'HC Verma Concepts of Physics',               sellingPrice: 350, buyingPrice: 700, condition: 'Like New',   category: 'Book',       city: 'Pune' },
];

/**
 * Fetch listings with the given filters.
 * TODO: Replace mock implementation with actual API call:
 *   const { data } = await api.get('/listings', { params: filters });
 *   return { listings: data.data, total: data.pagination.total, totalPages: data.pagination.totalPages };
 */
async function fetchListings(
  filters: Filters,
  sort: SortOption,
  page: number,
  perPage: number,
): Promise<{ listings: BookCardListing[]; total: number; totalPages: number }> {
  // --- Begin mock filtering ---
  let results = [...MOCK_LISTINGS];

  if (filters.board) {
    // In real API this is a query param; mock just passes through
    results = results; // no board field in mock cards
  }
  if (filters.category) {
    results = results.filter((l) => l.category === filters.category);
  }
  if (filters.city) {
    results = results.filter((l) =>
      l.city.toLowerCase().includes(filters.city.toLowerCase()),
    );
  }
  if (filters.priceMin) {
    results = results.filter((l) => l.sellingPrice >= Number(filters.priceMin));
  }
  if (filters.priceMax) {
    results = results.filter((l) => l.sellingPrice <= Number(filters.priceMax));
  }

  // Sort
  if (sort === 'price_asc') results.sort((a, b) => a.sellingPrice - b.sellingPrice);
  else if (sort === 'price_desc') results.sort((a, b) => b.sellingPrice - a.sellingPrice);
  // 'recent' keeps insertion order (newest first in mock)

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const listings = results.slice(start, start + perPage);

  return { listings, total, totalPages };
  // --- End mock filtering ---
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BOARDS = ['CBSE', 'ICSE', 'IB', 'State', 'IGCSE'] as const;
const PER_PAGE = 9;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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

  // Derive results synchronously from mock data (replace with useQuery when API is ready)
  const { listings, total, totalPages } = useMemo(
    () => {
      // fetchListings is async in shape but our mock is sync-safe via the
      // useMemo wrapper — when switching to real API, move to useQuery/useEffect.
      let results = [...MOCK_LISTINGS];

      if (filters.category) results = results.filter((l) => l.category === filters.category);
      if (filters.city) results = results.filter((l) => l.city.toLowerCase().includes(filters.city.toLowerCase()));
      if (filters.priceMin) results = results.filter((l) => l.sellingPrice >= Number(filters.priceMin));
      if (filters.priceMax) results = results.filter((l) => l.sellingPrice <= Number(filters.priceMax));

      if (sort === 'price_asc') results.sort((a, b) => a.sellingPrice - b.sellingPrice);
      else if (sort === 'price_desc') results.sort((a, b) => b.sellingPrice - a.sellingPrice);

      const total = results.length;
      const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
      const start = (page - 1) * PER_PAGE;
      return { listings: results.slice(start, start + PER_PAGE), total, totalPages };
    },
    [filters, sort, page],
  );

  const activeCity = filters.city || 'All Cities';

  /* ------ Pagination helpers ------ */
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }, [totalPages]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="container pt-12">
        {/* ---- Header ---- */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">
                <span className="w-8 h-[1px] bg-primary"></span>
                Marketplace
              </div>
              <h1 className="text-5xl font-black tracking-tight mb-3">
                Find your next book
              </h1>
              <p className="text-muted font-medium">
                Showing {total} verified listing{total !== 1 ? 's' : ''} in{' '}
                <span className="text-foreground font-bold">{activeCity}</span>
              </p>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4 bg-muted-extra-light p-1.5 rounded-2xl border border-card-border">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-light ml-4">
                Sort By:
              </span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer pr-4 text-foreground py-2"
              >
                <option value="recent">Recently Added</option>
                <option value="price_asc">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
              </select>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* ---- Sidebar ---- */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-28 flex flex-col gap-8">
              <div className="card-premium p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center justify-between">
                  Filters
                  <span
                    onClick={resetFilters}
                    className="text-primary cursor-pointer hover:underline"
                  >
                    Reset
                  </span>
                </h3>

                <div className="flex flex-col gap-10">
                  {/* Board */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-light block mb-4">
                      Academic Board
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {BOARDS.map((board) => (
                        <button
                          key={board}
                          onClick={() => updateFilter('board', filters.board === board ? '' : board)}
                          className={`px-4 py-2 rounded-xl border text-[11px] font-extrabold transition-all ${
                            filters.board === board
                              ? 'border-primary text-primary bg-primary/10'
                              : 'border-card-border hover:border-primary hover:text-primary bg-muted-extra-light/50'
                          }`}
                        >
                          {board}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class Level */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-light block mb-4">
                      Class Level
                    </span>
                    <select
                      value={filters.classLevel}
                      onChange={(e) => updateFilter('classLevel', e.target.value)}
                      className="w-full bg-muted-extra-light border border-card-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none appearance-none"
                    >
                      <option value="">All Classes</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                        <option key={c} value={String(c)}>Class {c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-light block mb-4">
                      Category
                    </span>
                    <div className="flex gap-2">
                      {['Book', 'Stationery'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                          className={`flex-1 px-4 py-2 rounded-xl border text-[11px] font-extrabold transition-all ${
                            filters.category === cat
                              ? 'border-primary text-primary bg-primary/10'
                              : 'border-card-border hover:border-primary hover:text-primary bg-muted-extra-light/50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-light">
                        Price Range
                      </span>
                      <span className="text-[10px] font-black text-primary">
                        {filters.priceMin || '0'} - {filters.priceMax || 'Any'}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.priceMin}
                        onChange={(e) => updateFilter('priceMin', e.target.value)}
                        className="w-1/2 bg-muted-extra-light border border-card-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.priceMax}
                        onChange={(e) => updateFilter('priceMax', e.target.value)}
                        className="w-1/2 bg-muted-extra-light border border-card-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-light block mb-4">
                      City
                    </span>
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={filters.city}
                      onChange={(e) => updateFilter('city', e.target.value)}
                      className="w-full bg-muted-extra-light border border-card-border rounded-xl px-4 py-3 text-xs font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Selling CTA */}
              <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-xs font-black text-primary mb-2 uppercase tracking-widest">
                    Selling?
                  </p>
                  <p className="text-sm text-primary/60 mb-6 font-medium leading-relaxed">
                    Turn your old books into pocket money today.
                  </p>
                  <Link
                    href="/sell"
                    className="w-full btn btn-primary h-12 text-[10px] font-black uppercase tracking-widest shadow-lg"
                  >
                    Post Listing
                  </Link>
                </div>
                <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 group-hover:scale-110 transition-transform duration-500">
                  📚
                </div>
              </div>
            </div>
          </aside>

          {/* ---- Results ---- */}
          <main className="flex-1">
            {listings.length === 0 ? (
              <div className="card-premium p-16 text-center">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-2xl font-black mb-3">No listings found</h2>
                <p className="text-muted font-medium mb-6">
                  Try adjusting your filters or check back later.
                </p>
                <button onClick={resetFilters} className="btn btn-outline text-xs font-black uppercase tracking-widest">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid-marketplace">
                {listings.map((listing) => (
                  <BookCard key={listing.id} {...listing} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-20 flex justify-center items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`h-12 px-6 rounded-2xl border border-card-border text-[10px] font-black uppercase tracking-widest transition-all ${
                    page === 1
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:border-primary hover:text-primary'
                  }`}
                >
                  Prev
                </button>

                <div className="flex gap-2">
                  {pageNumbers.map((n) => (
                    <span
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black cursor-pointer transition-colors ${
                        n === page
                          ? 'bg-primary text-white'
                          : 'border border-card-border hover:bg-muted-extra-light'
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`h-12 px-6 rounded-2xl border border-card-border text-[10px] font-black uppercase tracking-widest transition-all ${
                    page === totalPages
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:border-primary hover:text-primary'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
