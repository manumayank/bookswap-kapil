'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AdminRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests', page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/requests', { params });
      return data;
    },
    enabled: !!user?.isAdmin,
  });

  const requests = data?.data || [];
  const pagination = data?.pagination;

  if (!user?.isAdmin) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Requests</h1>
        <p className="text-[var(--muted)]">
          {pagination?.total ?? 0} total book requests
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-light)]" />
        <input
          type="text"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-[420px] pl-11"
        />
      </div>

      <div className="card-premium overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--muted)]">Loading requests...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">User</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Class</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Board</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">City</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Status</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--muted)]">
                    {search ? 'No requests match your search' : 'No requests yet'}
                  </td>
                </tr>
              ) : (
                requests.map((req: any) => (
                  <tr key={req.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--muted-extra-light)] transition-colors">
                    <td className="px-6 py-4 text-sm font-bold">{req.user?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm">Class {req.class || '-'}</td>
                    <td className="px-6 py-4">
                      {req.board ? (
                        <span className="badge badge-primary">{req.board}</span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{req.city || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        req.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600' :
                        req.status === 'MATCHED' ? 'bg-blue-500/10 text-blue-600' :
                        req.status === 'FLOATED' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {new Date(req.createdAt).toLocaleDateString()}
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
            className="btn btn-outline disabled:opacity-40"
            style={{ height: 40, fontSize: '0.875rem' }}
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-[var(--muted)]">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="btn btn-outline disabled:opacity-40"
            style={{ height: 40, fontSize: '0.875rem' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
