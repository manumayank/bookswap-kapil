'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BrowsePage() {
  const [filters, setFilters] = useState({
    board: '',
    class: '',
    city: '',
    condition: '',
  });

  // TODO: Fetch listings from API
  const listings: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">📚 BookSwap</Link>
          <nav className="flex gap-4">
            <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Login
            </Link>
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
                onChange={(e) => setFilters({...filters, board: e.target.value})}
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
                onChange={(e) => setFilters({...filters, class: e.target.value})}
              >
                <option value="">All Classes</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
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
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select 
                className="w-full border rounded-lg px-3 py-2"
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
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

        {/* Results */}
        {listings.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold mb-2">No listings yet</h2>
            <p className="text-gray-600 mb-4">Be the first to list books in your area!</p>
            <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-green-700">
              List Your Books
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">Class {listing.class} - {listing.board}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {listing.condition}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{listing.city}</p>
                  <p className="text-sm text-gray-500">{listing.listingType === 'SET' ? 'Full Set' : 'Individual Books'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
