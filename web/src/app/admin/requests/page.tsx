'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/requests');
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const requests = data?.data || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Requests</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Class</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">City</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Floated</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">No requests yet</td>
              </tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">Class {req.class}</td>
                  <td className="px-6 py-4">{req.board}</td>
                  <td className="px-6 py-4">{req.city}</td>
                  <td className="px-6 py-4">{req.status}</td>
                  <td className="px-6 py-4">{req.isFloated ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
