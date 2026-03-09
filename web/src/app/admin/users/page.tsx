'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
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
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-light)]" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
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
          <div className="p-12 text-center text-[var(--muted)]">Loading users...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Name</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Email</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">City</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Board</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Listings</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Verified</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Joined</th>
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
                          <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{u.email}</td>
                    <td className="px-6 py-4 text-sm">{u.city || '-'}</td>
                    <td className="px-6 py-4">
                      {u.board ? (
                        <span className="badge badge-primary">{u.board}</span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{u._count?.listings ?? u.listingsCount ?? 0}</td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <ShieldCheck size={18} className="text-[var(--secondary)]" />
                      ) : (
                        <span className="text-xs text-[var(--muted-light)]">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
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
