'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // TODO: Create admin endpoint
      return { data: [] };
    },
  });

  const users = data?.data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="text-sm text-gray-500">{users.length} total users</div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">City</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Children</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No users yet
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.city}</td>
                  <td className="px-6 py-4">{user.board}</td>
                  <td className="px-6 py-4">{user.children?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
