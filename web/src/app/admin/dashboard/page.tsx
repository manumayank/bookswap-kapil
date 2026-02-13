'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Stats {
  users: number;
  listings: number;
  requests: number;
  matches: number;
  schools: number;
}

export default function AdminDashboard() {
  // TODO: Create stats endpoint in backend
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Placeholder - will implement stats endpoint
      return {
        users: 0,
        listings: 0,
        requests: 0,
        matches: 0,
        schools: 0,
      };
    },
  });

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, color: 'bg-blue-500' },
    { label: 'Active Listings', value: stats?.listings || 0, color: 'bg-green-500' },
    { label: 'Open Requests', value: stats?.requests || 0, color: 'bg-yellow-500' },
    { label: 'Matches Made', value: stats?.matches || 0, color: 'bg-purple-500' },
    { label: 'Schools', value: stats?.schools || 0, color: 'bg-pink-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl font-bold mb-4`}>
              {stat.value}
            </div>
            <h3 className="text-gray-600 text-sm">{stat.label}</h3>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Listings</h2>
          <div className="text-gray-500 text-center py-8">
            No listings yet
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Matches</h2>
          <div className="text-gray-500 text-center py-8">
            No matches yet
          </div>
        </div>
      </div>
    </div>
  );
}
