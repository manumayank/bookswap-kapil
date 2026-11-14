'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '../_components/ConfirmDialog';
import ErrorState, { InlineError } from '../_components/ErrorState';
import StatusBadge from '../_components/StatusBadge';
import { enumLabel } from '../_components/labels';

const STATUS_OPTIONS = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;

type Grievance = {
  id: string;
  subject: string;
  description: string;
  transactionCode: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

export default function AdminGrievancesPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [dismissTarget, setDismissTarget] = useState<Grievance | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    if (user && !user.isAdmin) router.replace('/login');
  }, [user, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-grievances', statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/grievances', { params });
      return data.data as Grievance[];
    },
    enabled: !!user?.isAdmin,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/grievances/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grievances'] });
      setDismissTarget(null);
    },
  });

  if (!user?.isAdmin) return null;

  const grievances = data || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Grievances</h1>
        <p className="text-[var(--muted)]">User-submitted reports.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {['', ...STATUS_OPTIONS].map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s || 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(s)}
              className={`h-10 px-4 rounded-full text-sm font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 ${
                active
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'border-[var(--card-border)] hover:bg-[var(--muted-extra-light)]'
              }`}
            >
              {s ? enumLabel(s) : 'All'}
            </button>
          );
        })}
      </div>

      {/* Mutation error not tied to the dismiss dialog (e.g. Mark resolved) */}
      {!dismissTarget && updateStatus.isError && (
        <div className="mb-4">
          <InlineError error={updateStatus.error} />
        </div>
      )}

      {isLoading ? (
        <div className="card-flat p-12 text-center text-[var(--muted)]">Loading grievances...</div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Could not load grievances" />
      ) : grievances.length === 0 ? (
        <div className="card-flat p-12 text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-[var(--secondary)]" />
          <p className="text-sm text-[var(--muted)]">No grievances in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => {
            const busy = updateStatus.isPending && updateStatus.variables?.id === g.id;
            return (
              <div key={g.id} className="card-flat p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-black break-words">{g.subject}</p>
                      <StatusBadge status={g.status} />
                    </div>
                    <p className="text-xs text-[var(--muted)] break-words">
                      From {g.user.name} ({g.user.email}) — {new Date(g.createdAt).toLocaleString()}
                      {g.transactionCode && ` — Txn: ${g.transactionCode}`}
                    </p>
                    <p className="text-sm mt-3 whitespace-pre-wrap break-words">{g.description}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      className="btn btn-secondary h-10 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={g.status === 'RESOLVED' || busy}
                      onClick={() => updateStatus.mutate({ id: g.id, status: 'RESOLVED' })}
                    >
                      {busy && updateStatus.variables?.status === 'RESOLVED' ? 'Saving…' : 'Mark resolved'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline h-10 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={g.status === 'DISMISSED' || busy}
                      onClick={() => {
                        updateStatus.reset();
                        setDismissTarget(g);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!dismissTarget}
        title="Dismiss this grievance?"
        message={dismissTarget ? <>“{dismissTarget.subject}” from {dismissTarget.user.name} will be marked as dismissed.</> : null}
        confirmLabel="Dismiss"
        pendingLabel="Dismissing…"
        tone="danger"
        isPending={updateStatus.isPending}
        error={dismissTarget ? updateStatus.error : null}
        onCancel={() => {
          setDismissTarget(null);
          updateStatus.reset();
        }}
        onConfirm={() => dismissTarget && updateStatus.mutate({ id: dismissTarget.id, status: 'DISMISSED' })}
      />
    </div>
  );
}
