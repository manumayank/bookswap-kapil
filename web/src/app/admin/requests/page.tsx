'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ClipboardList, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '../_components/ConfirmDialog';
import ErrorState, { InlineError } from '../_components/ErrorState';
import StatusBadge from '../_components/StatusBadge';
import { enumLabel } from '../_components/labels';
import PageHeader from '@/components/app/PageHeader';
import EmptyState from '@/components/app/EmptyState';
import Pagination from '@/components/app/Pagination';
import { TABLE_WRAP, TABLE, TH, TH_RIGHT, TR, TD, TD_RIGHT } from '@/components/app/table';
import { shortDate } from '@/components/app/status';

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

  const total: number | undefined = pagination?.total;

  return (
    <div className="animate-fade-in">
      <PageHeader
        size="md"
        title="Requests"
        description={
          total == null
            ? 'Book requests from parents looking for a specific class and board.'
            : `${total.toLocaleString('en-IN')} book ${total === 1 ? 'request' : 'requests'}. Approve them so matching listings notify the parent.`
        }
      />

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search requests"
          aria-label="Search requests"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-11 md:w-[420px]"
        />
      </div>

      {approve.isError && (
        <div className="mb-4">
          <InlineError error={approve.error} />
        </div>
      )}

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load requests" />
      ) : (
        <div className={TABLE_WRAP}>
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted">Loading requests…</div>
          ) : requests.length === 0 ? (
            <EmptyState
              bare
              icon={ClipboardList}
              title={search ? 'No requests match your search' : 'No requests yet'}
              description={search ? 'Try a different search term.' : 'Requests appear here when parents ask for a book that isn’t listed.'}
            />
          ) : (
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>Parent</th>
                  <th className={TH}>Class</th>
                  <th className={TH}>Board</th>
                  <th className={TH}>City</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Created</th>
                  <th className={TH_RIGHT}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: any) => {
                  const approving = approve.isPending && approve.variables === req.id;
                  const rejecting = reject.isPending && reject.variables?.id === req.id;
                  return (
                    <tr key={req.id} className={TR}>
                      <td className={`${TD} font-bold`}>{req.user?.name || '-'}</td>
                      <td className={`${TD} whitespace-nowrap`}>{req.class ? `Class ${req.class}` : '-'}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {req.board ? <span className="badge badge-muted">{enumLabel(req.board)}</span> : <span className="text-muted">-</span>}
                      </td>
                      <td className={TD}>{req.city || '-'}</td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <StatusBadge status={req.status} />
                      </td>
                      <td className={`${TD} whitespace-nowrap text-muted`}>{shortDate(req.createdAt)}</td>
                      <td className={TD_RIGHT}>
                        {req.status === 'PENDING_APPROVAL' && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => approve.mutate(req.id)}
                              disabled={approving || rejecting}
                            >
                              {approving ? 'Approving…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm text-accent"
                              onClick={() => {
                                reject.reset();
                                setRejectTarget({ id: req.id, name: req.user?.name || 'this parent' });
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
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination && <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject this request?"
        message={rejectTarget ? <>The book request from {rejectTarget.name} will be rejected.</> : null}
        confirmLabel="Reject request"
        pendingLabel="Rejecting…"
        tone="danger"
        withReason
        reasonPlaceholder="For example: duplicate request. The parent will see this."
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
