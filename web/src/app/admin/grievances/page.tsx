'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const STATUS_OPTIONS = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;

export default function AdminGrievancesPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
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

  const { data } = useQuery({
    queryKey: ['admin-grievances', statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/grievances', { params });
      return data.data as Array<{
        id: string;
        subject: string;
        description: string;
        transactionCode: string | null;
        status: string;
        createdAt: string;
        user: { id: string; name: string; email: string };
      }>;
    },
    enabled: !!user?.isAdmin,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/grievances/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-grievances'] }),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black mb-2">Grievances</h1>
      <p className="text-muted mb-6">User-submitted reports.</p>

      <div className="mb-4 flex gap-2">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              statusFilter === s ? 'bg-primary text-white border-primary' : 'border-card-border'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {(data || []).map((g) => (
          <div key={g.id} className="card-premium p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black">{g.subject}</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted-extra-light">{g.status}</span>
                </div>
                <p className="text-xs text-muted">
                  From {g.user.name} ({g.user.email}) — {new Date(g.createdAt).toLocaleString()}
                  {g.transactionCode && ` — Txn: ${g.transactionCode}`}
                </p>
                <p className="text-sm mt-3 whitespace-pre-wrap">{g.description}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  className="btn btn-secondary text-xs px-3 py-1"
                  disabled={g.status === 'RESOLVED' || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: g.id, status: 'RESOLVED' })}
                >
                  Mark resolved
                </button>
                <button
                  className="btn btn-outline text-xs px-3 py-1"
                  disabled={g.status === 'DISMISSED' || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: g.id, status: 'DISMISSED' })}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted">No grievances in this view.</p>
        )}
      </div>
    </div>
  );
}
