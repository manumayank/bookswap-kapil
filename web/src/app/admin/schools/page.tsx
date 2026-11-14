'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, X, School, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ErrorState, { InlineError } from '../_components/ErrorState';
import { enumLabel } from '../_components/labels';
import PageHeader from '@/components/app/PageHeader';
import EmptyState from '@/components/app/EmptyState';
import { TABLE_WRAP, TABLE, TH, TH_RIGHT, TR, TD, TD_RIGHT } from '@/components/app/table';

interface SchoolForm {
  name: string;
  city: string;
  board: string;
  address: string;
}

const emptyForm: SchoolForm = { name: '', city: '', board: '', address: '' };

const labelClass = 'mb-2 block text-sm font-semibold';

export default function AdminSchoolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrate } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = useId();

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
    queryKey: ['admin-schools', search],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      const { data } = await api.get('/admin/schools', { params });
      return data;
    },
    enabled: !!user?.isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (school: SchoolForm) => api.post('/admin/schools', school),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, school }: { id: string; school: SchoolForm }) =>
      api.put(`/admin/schools/${id}`, school),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      resetForm();
    },
  });

  const schools = data?.data || [];

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(school: any) {
    setForm({
      name: school.name || '',
      city: school.city || '',
      board: school.board || '',
      address: school.address || '',
    });
    setEditingId(school.id);
    setShowForm(true);
    createMutation.reset();
    updateMutation.reset();
    // Wait for the form to render, then bring it into view.
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, school: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!user?.isAdmin) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        size="md"
        title="Schools"
        description="The school list parents pick from when they list or request books."
        actions={
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className={`btn btn-sm ${showForm ? 'btn-outline' : 'btn-primary'}`}
          >
            {showForm ? (
              <>
                <X size={16} aria-hidden="true" /> Close form
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden="true" /> Add school
              </>
            )}
          </button>
        }
      />

      {/* Add/Edit Form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="card-flat animate-fade-in mb-8 scroll-mt-40 p-4 sm:p-6 md:scroll-mt-28"
        >
          <h2 className="mb-5 text-xl">{editingId ? `Edit ${form.name || 'school'}` : 'Add a school'}</h2>
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={`${fieldId}-name`} className={labelClass}>
                School name
              </label>
              <input
                id={`${fieldId}-name`}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Delhi Public School"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-city`} className={labelClass}>
                City
              </label>
              <input
                id={`${fieldId}-city`}
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Bangalore"
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor={`${fieldId}-board`} className={labelClass}>
                Board
              </label>
              <select
                id={`${fieldId}-board`}
                value={form.board}
                onChange={(e) => setForm({ ...form, board: e.target.value })}
                required
                className="w-full"
              >
                <option value="">Select board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="STATE">State Board</option>
                <option value="IB">IB</option>
                <option value="IGCSE">IGCSE</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${fieldId}-address`} className={labelClass}>
                Address <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${fieldId}-address`}
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, area"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
              {isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Add school'}
            </button>
            <button type="button" onClick={resetForm} disabled={isSaving} className="btn btn-outline btn-sm">
              Cancel
            </button>
          </div>
          <InlineError error={createMutation.error || updateMutation.error} />
        </form>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search schools"
          aria-label="Search schools"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 md:w-[420px]"
        />
      </div>

      {/* Schools List */}
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load schools" />
      ) : (
        <div className={TABLE_WRAP}>
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted">Loading schools…</div>
          ) : schools.length === 0 ? (
            <EmptyState
              bare
              icon={School}
              title={search ? 'No schools match your search' : 'No schools yet'}
              description={search ? 'Try a different name or city.' : 'Add the first school so parents can pick it.'}
            />
          ) : (
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>School</th>
                  <th className={TH}>City</th>
                  <th className={TH}>Board</th>
                  <th className={TH}>Address</th>
                  <th className={TH_RIGHT}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school: any) => (
                  <tr key={school.id} className={`${TR} ${editingId === school.id ? 'bg-muted-extra-light' : ''}`}>
                    <td className={`${TD} font-bold`}>{school.name}</td>
                    <td className={TD}>{school.city || '-'}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {school.board ? (
                        <span className="badge badge-muted">{enumLabel(school.board)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className={`${TD} text-muted`}>{school.address || '-'}</td>
                    <td className={TD_RIGHT}>
                      <button
                        type="button"
                        onClick={() => startEdit(school)}
                        aria-label={`Edit ${school.name}`}
                        className="btn btn-outline btn-sm"
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
