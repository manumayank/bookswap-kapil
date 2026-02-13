'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminSchoolsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-schools'],
    queryFn: async () => {
      try {
        const res = await api.get('/schools');
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const schools = data?.data || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Schools</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">City</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Verified</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500">No schools yet</td>
              </tr>
            ) : (
              schools.map((school: any) => (
                <tr key={school.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{school.name}</td>
                  <td className="px-6 py-4">{school.city}</td>
                  <td className="px-6 py-4">{school.board}</td>
                  <td className="px-6 py-4">{school.isVerified ? '✓' : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
