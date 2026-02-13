'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const { data } = await api.get('/listings/my');
      return data.data;
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['myRequests'],
    queryFn: async () => {
      const { data } = await api.get('/requests');
      return data.data;
    },
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['myMatches'],
    queryFn: async () => {
      const { data } = await api.get('/matches');
      return data.data;
    },
  });

  const activeListings = listings?.filter((l: any) => l.status === 'ACTIVE') || [];
  const openRequests = requests?.filter((r: any) => r.status === 'OPEN' || r.status === 'MATCHED') || [];
  const pendingMatches = matches?.filter((m: any) => m.status === 'PENDING' || m.status === 'ACCEPTED') || [];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome{user ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600 mt-1">Manage your book listings, requests, and matches.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/listings/new"
          className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors"
        >
          <h3 className="text-lg font-semibold">Give Books</h3>
          <p className="text-green-100 text-sm mt-1">List books you want to give away</p>
        </Link>
        <Link
          href="/browse"
          className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <h3 className="text-lg font-semibold">Find Books</h3>
          <p className="text-blue-100 text-sm mt-1">Search for books your child needs</p>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="text-3xl font-bold text-green-600">{activeListings.length}</div>
          <div className="text-gray-600 text-sm mt-1">Active Listings</div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="text-3xl font-bold text-blue-600">{openRequests.length}</div>
          <div className="text-gray-600 text-sm mt-1">Open Requests</div>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <div className="text-3xl font-bold text-purple-600">{pendingMatches.length}</div>
          <div className="text-gray-600 text-sm mt-1">Pending Matches</div>
        </div>
      </div>

      {/* My Listings */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Listings</h2>
          <Link href="/dashboard/listings/new" className="text-sm text-green-600 hover:underline">
            + New Listing
          </Link>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          {listingsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : !listings?.length ? (
            <div className="p-8 text-center text-gray-500">
              No listings yet.{' '}
              <Link href="/dashboard/listings/new" className="text-green-600 hover:underline">
                Create your first listing
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Books</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Class</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Condition</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing: any) => (
                  <tr key={listing.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {listing.items?.map((i: any) => i.subject).join(', ') || 'Book Set'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listing.listingType === 'SET' ? 'Full Set' : 'Individual'} &middot; {listing.city}
                      </div>
                    </td>
                    <td className="px-6 py-4">Class {listing.class}</td>
                    <td className="px-6 py-4">{listing.board}</td>
                    <td className="px-6 py-4 text-sm">{listing.condition.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          listing.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : listing.status === 'EXCHANGED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Matches */}
      <section>
        <h2 className="text-xl font-semibold mb-4">My Matches</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          {matchesLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : !matches?.length ? (
            <div className="p-8 text-center text-gray-500">
              No matches yet. Create listings or requests to get matched!
            </div>
          ) : (
            <div className="divide-y">
              {matches.map((match: any) => {
                const isGiver = match.giverId === user?.id;
                const other = isGiver ? match.receiver : match.giver;
                return (
                  <div key={match.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {isGiver ? 'Giving to' : 'Receiving from'} {other?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Class {match.listing?.class} &middot; {match.listing?.board} &middot;{' '}
                        {other?.city}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        match.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : match.status === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
