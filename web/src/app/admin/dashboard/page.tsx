'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
  });

  const { data: recentListingsData } = useQuery({
    queryKey: ['admin-recent-listings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/listings', { params: { limit: 5 } });
      return data.data;
    },
  });

  const statCards = [
    { label: 'Total Users', value: stats?.users ?? '-', color: 'bg-blue-500' },
    { label: 'Active Listings', value: stats?.listings ?? '-', color: 'bg-green-500' },
    { label: 'Open Requests', value: stats?.requests ?? '-', color: 'bg-yellow-500' },
    { label: 'Matches Made', value: stats?.matches ?? '-', color: 'bg-purple-500' },
    { label: 'Schools', value: stats?.schools ?? '-', color: 'bg-pink-500' },
  ];

  const recentListings = recentListingsData || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl font-bold mb-4`}>
              {isLoading ? '...' : stat.value}
            </div>
            <h3 className="text-gray-600 text-sm">{stat.label}</h3>
          </div>
        ))}
      </div>

      {/* Extra stats */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-green-600">{stats.completedMatches}</div>
            <div className="text-gray-600 text-sm">Completed Exchanges</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalListings}</div>
            <div className="text-gray-600 text-sm">Total Listings (all time)</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRequests}</div>
            <div className="text-gray-600 text-sm">Total Requests (all time)</div>
          </div>
        </div>
      )}

      {/* Recent Listings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Listings</h2>
        {recentListings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No listings yet</div>
        ) : (
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Class</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Board</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">City</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentListings.map((listing: any) => (
                <tr key={listing.id} className="border-b last:border-0">
                  <td className="py-3 text-sm">{listing.user?.name}</td>
                  <td className="py-3 text-sm">Class {listing.class}</td>
                  <td className="py-3 text-sm">{listing.board}</td>
                  <td className="py-3 text-sm">{listing.city}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      listing.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
