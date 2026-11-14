'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ErrorState from '../_components/ErrorState';
import { enumLabel } from '../_components/labels';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    if (user && !user.isAdmin) {
      router.replace('/login');
    }
  }, [user, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
    enabled: !!user?.isAdmin,
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  if (!user?.isAdmin) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Users</h1>
          <p className="text-[var(--muted)]">
            {pagination?.total ?? 0} registered users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          aria-label="Search users"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-[420px] pl-11"
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Could not load users" />
      ) : (
      <div className="card-flat overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--muted)]">Loading users...</div>
        ) : (
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Name</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Email</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">City</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Board</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Listings</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Verified</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                    {search ? 'No users match your search' : 'No users yet'}
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--muted-extra-light)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{u.name}</span>
                        {u.isAdmin && (
                          <span className="badge badge-primary">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{u.email}</td>
                    <td className="px-6 py-4 text-sm">{u.city || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.board ? (
                        <span className="badge badge-primary">{enumLabel(u.board)}</span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{u._count?.listings ?? u.listingsCount ?? 0}</td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <ShieldCheck size={18} className="text-[var(--secondary)]" aria-label="Verified" />
                      ) : (
                        <span className="text-xs text-[var(--muted)]">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-outline h-10 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-[var(--muted)]">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="btn btn-outline h-10 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
