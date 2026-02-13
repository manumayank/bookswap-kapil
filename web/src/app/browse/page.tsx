'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const CONDITION_LABELS: Record<string, string> = {
  UNUSED: 'Unused',
  ALMOST_NEW: 'Almost New',
  WATER_MARKS: 'Minor Marks',
  UNDERLINED: 'Underlined',
};

export default function BrowsePage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [filters, setFilters] = useState({
    board: '',
    class: '',
    city: '',
    condition: '',
  });

  useEffect(() => {
    hydrate();
  }, []);

  // Build query params, omitting empty strings
  const queryParams: Record<string, string> = {};
  if (filters.board) queryParams.board = filters.board;
  if (filters.class) queryParams.class = filters.class;
  if (filters.city) queryParams.city = filters.city;
  if (filters.condition) queryParams.condition = filters.condition;

  const { data, isLoading } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/listings', { params: queryParams });
      return data;
    },
  });

  const listings = data?.data || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">BookSwap</Link>
          <nav className="flex gap-4 items-center">
            <Link href="/browse" className="text-gray-600 hover:text-green-600 font-medium">
              Browse
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Available Books</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filters.board}
                onChange={(e) => setFilters({ ...filters, board: e.target.value })}
              >
                <option value="">All Boards</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="STATE">State Board</option>
                <option value="IB">IB</option>
                <option value="IGCSE">IGCSE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
              >
                <option value="">All Classes</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
              >
                <option value="">Any Condition</option>
                <option value="UNUSED">Unused</option>
                <option value="ALMOST_NEW">Almost New</option>
                <option value="WATER_MARKS">Minor Marks</option>
                <option value="UNDERLINED">Underlined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            {total} listing{total !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="text-gray-500">Loading listings...</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">No listings found</h2>
            <p className="text-gray-600 mb-4">
              {Object.values(queryParams).some(Boolean)
                ? 'Try adjusting your filters'
                : 'Be the first to list books in your area!'}
            </p>
            <Link
              href={isAuthenticated ? '/dashboard/listings/new' : '/login'}
              className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-green-700"
            >
              List Your Books
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {listings.map((listing: any) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-3 bg-green-500" />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">
                      Class {listing.class} &middot; {listing.board}
                    </h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {CONDITION_LABELS[listing.condition] || listing.condition}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    {listing.listingType === 'SET' ? 'Full Book Set' : 'Individual Books'} &middot;{' '}
                    {listing.city}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    By {listing.user?.name || 'Anonymous'}
                  </p>

                  {/* Book items */}
                  {listing.items?.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {listing.items.length} book{listing.items.length !== 1 ? 's' : ''}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {listing.items.slice(0, 4).map((item: any) => (
                          <span
                            key={item.id}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {item.subject}
                          </span>
                        ))}
                        {listing.items.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{listing.items.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exchange preferences */}
                  {listing.exchangePreference?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {listing.exchangePreference.map((pref: string) => (
                        <span
                          key={pref}
                          className="text-xs text-gray-500 border rounded px-2 py-0.5"
                        >
                          {pref === 'PICKUP' ? 'Pickup' : pref === 'SCHOOL' ? 'School' : 'Porter'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
