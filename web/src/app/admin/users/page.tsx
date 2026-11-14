'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldCheck, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ErrorState from '../_components/ErrorState';
import { enumLabel } from '../_components/labels';
import PageHeader from '@/components/app/PageHeader';
import EmptyState from '@/components/app/EmptyState';
import Pagination from '@/components/app/Pagination';
import { TABLE_WRAP, TABLE, TH, TH_RIGHT, TR, TD, TD_RIGHT } from '@/components/app/table';
import { shortDate } from '@/components/app/status';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
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

  const total: number | undefined = pagination?.total;

  return (
    <div className="animate-fade-in">
      <PageHeader
        size="md"
        title="Users"
        description={
          total == null
            ? 'Parents registered on Sybrary.'
            : `${total.toLocaleString('en-IN')} registered ${total === 1 ? 'parent' : 'parents'}.`
        }
      />

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search by name, email or city"
          aria-label="Search users"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-11 md:w-[420px]"
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load users" />
      ) : (
        <div className={TABLE_WRAP}>
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted">Loading users…</div>
          ) : users.length === 0 ? (
            <EmptyState
              bare
              icon={Users}
              title={search ? 'No users match your search' : 'No users yet'}
              description={search ? 'Try a name, email address or city.' : undefined}
            />
          ) : (
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>City</th>
                  <th className={TH}>Board</th>
                  <th className={TH_RIGHT}>Listings</th>
                  <th className={TH}>Verified</th>
                  <th className={TH}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className={TR}>
                    <td className={TD}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{u.name}</span>
                        {u.isAdmin && <span className="badge badge-primary">Admin</span>}
                      </div>
                    </td>
                    <td className={`${TD} text-muted`}>{u.email}</td>
                    <td className={TD}>{u.city || '-'}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {u.board ? <span className="badge badge-muted">{enumLabel(u.board)}</span> : <span className="text-muted">-</span>}
                    </td>
                    <td className={`${TD_RIGHT} font-bold tabular-nums`}>{u._count?.listings ?? u.listingsCount ?? 0}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-secondary-dark">
                          <ShieldCheck size={16} aria-hidden="true" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-muted">Not verified</span>
                      )}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-muted`}>{shortDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />}
    </div>
  );
}
