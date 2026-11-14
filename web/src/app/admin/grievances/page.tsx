'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '../_components/ConfirmDialog';
import ErrorState, { InlineError } from '../_components/ErrorState';
import StatusBadge from '../_components/StatusBadge';
import { enumLabel } from '../_components/labels';
import PageHeader from '@/components/app/PageHeader';
import EmptyState from '@/components/app/EmptyState';

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

function formatWhen(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

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
  const filterName = statusFilter ? enumLabel(statusFilter).toLowerCase() : '';

  return (
    <div className="animate-fade-in">
      <PageHeader
        size="md"
        title="Grievances"
        description={
          statusFilter === 'OPEN' && !isLoading && !isError
            ? grievances.length
              ? `${grievances.length} open ${grievances.length === 1 ? 'report' : 'reports'} from parents.`
              : 'No open reports from parents.'
            : 'Reports parents send about a deal or another parent.'
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            aria-pressed={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            className="chip"
          >
            {s ? enumLabel(s) : 'All'}
          </button>
        ))}
      </div>

      {/* Mutation error not tied to the dismiss dialog (e.g. Mark resolved) */}
      {!dismissTarget && updateStatus.isError && (
        <div className="mb-4">
          <InlineError error={updateStatus.error} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="card-flat space-y-2 p-5">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-3 w-1/4" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load grievances" />
      ) : grievances.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filterName ? `No ${filterName} grievances` : 'No grievances yet'}
          description="Reports from parents show up here."
        />
      ) : (
        <ul className="space-y-3">
          {grievances.map((g) => {
            const busy = updateStatus.isPending && updateStatus.variables?.id === g.id;
            return (
              <li key={g.id} className="card-flat p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-lg font-bold tracking-normal">{g.subject}</h2>
                      <StatusBadge status={g.status} />
                      {g.transactionCode && <span className="badge badge-muted">Deal {g.transactionCode}</span>}
                    </div>
                    <p className="mt-1 break-words text-[13px] text-muted">
                      From <span className="font-semibold text-foreground">{g.user.name}</span> ({g.user.email})
                    </p>
                    <p className="text-[13px] text-muted-light">{formatWhen(g.createdAt)}</p>
                    <p className="mt-3 max-w-[70ch] whitespace-pre-wrap break-words text-sm">{g.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                      disabled={g.status === 'RESOLVED' || busy}
                      onClick={() => updateStatus.mutate({ id: g.id, status: 'RESOLVED' })}
                    >
                      {busy && updateStatus.variables?.status === 'RESOLVED' ? 'Saving…' : 'Mark resolved'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm flex-1 sm:flex-none"
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
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!dismissTarget}
        title="Dismiss this grievance?"
        message={
          dismissTarget ? (
            <>
              &ldquo;{dismissTarget.subject}&rdquo; from {dismissTarget.user.name} will be marked as dismissed.
            </>
          ) : null
        }
        confirmLabel="Dismiss grievance"
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
