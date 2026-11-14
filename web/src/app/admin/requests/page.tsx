'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '../_components/ConfirmDialog';
import ErrorState, { InlineError } from '../_components/ErrorState';
import StatusBadge from '../_components/StatusBadge';
import { enumLabel } from '../_components/labels';

const thClass =
  'text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap';

export default function AdminRequestsPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

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
    queryKey: ['admin-requests', page, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 50 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/requests', { params });
      return data;
    },
    enabled: !!user?.isAdmin,
  });

  const queryClient = useQueryClient();
  const approve = useMutation({
    mutationFn: async (id: string) => api.put(`/admin/requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      api.put(`/admin/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      setRejectTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
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
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search requests..."
          aria-label="Search requests"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-[420px] pl-11"
        />
      </div>

      {approve.isError && (
        <div className="mb-4">
          <InlineError error={approve.error} />
        </div>
      )}

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Could not load requests" />
      ) : (
        <div className="card-flat overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--muted)]">Loading requests...</div>
          ) : (
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className={thClass}>User</th>
                  <th className={thClass}>Class</th>
                  <th className={thClass}>Board</th>
                  <th className={thClass}>City</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Created</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                      {search ? 'No requests match your search' : 'No requests yet'}
                    </td>
                  </tr>
                ) : (
                  requests.map((req: any) => {
                    const approving = approve.isPending && approve.variables === req.id;
                    const rejecting = reject.isPending && reject.variables?.id === req.id;
                    return (
                      <tr key={req.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--muted-extra-light)] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold">{req.user?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">{req.class ? `Class ${req.class}` : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {req.board ? (
                            <span className="badge badge-primary">{enumLabel(req.board)}</span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">{req.city || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--muted)] whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'PENDING_APPROVAL' && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn btn-secondary h-10 px-3 text-xs whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => approve.mutate(req.id)}
                                disabled={approving || rejecting}
                              >
                                {approving ? 'Approving…' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline h-10 px-3 text-xs whitespace-nowrap text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() => {
                                  reject.reset();
                                  setRejectTarget({ id: req.id, name: req.user?.name || 'this user' });
                                }}
                                disabled={approving || rejecting}
                              >
                                {rejecting ? 'Rejecting…' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
            type="button"
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
            type="button"
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            className="btn btn-outline h-10 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject this request?"
        message={rejectTarget ? <>The book request from {rejectTarget.name} will be rejected.</> : null}
        confirmLabel="Reject request"
        pendingLabel="Rejecting…"
        tone="danger"
        withReason
        reasonPlaceholder="e.g. Duplicate request (shared with the user)"
        isPending={reject.isPending}
        error={reject.error}
        onCancel={() => {
          setRejectTarget(null);
          reject.reset();
        }}
        onConfirm={(reason) => rejectTarget && reject.mutate({ id: rejectTarget.id, reason })}
      />
    </div>
  );
}
