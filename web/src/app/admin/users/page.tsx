'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="text-sm text-gray-500">
          {pagination?.total ?? 0} total users
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-96 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading users...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">City</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Board</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Listings</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Children</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {search ? 'No users match your search' : 'No users yet'}
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{user.name}</div>
                      {user.isAdmin && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm">{user.city}</td>
                    <td className="px-6 py-4 text-sm">{user.board}</td>
                    <td className="px-6 py-4 text-sm">{user._count?.listings ?? 0}</td>
                    <td className="px-6 py-4 text-sm">{user.children?.length ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
