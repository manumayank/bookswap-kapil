'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminListingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/listings');
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const listings = data?.data || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Listings</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Class</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">City</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Condition</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">No listings yet</td>
              </tr>
            ) : (
              listings.map((listing: any) => (
                <tr key={listing.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">Class {listing.class}</td>
                  <td className="px-6 py-4">{listing.board}</td>
                  <td className="px-6 py-4">{listing.city}</td>
                  <td className="px-6 py-4">{listing.condition}</td>
                  <td className="px-6 py-4">{listing.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
