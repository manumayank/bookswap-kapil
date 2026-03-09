'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, X, School, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface SchoolForm {
  name: string;
  city: string;
  board: string;
  address: string;
}

const emptyForm: SchoolForm = { name: '', city: '', board: '', address: '' };

export default function AdminSchoolsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchoolForm>(emptyForm);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
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
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Schools</h1>
          <p className="text-[var(--muted)]">Manage the school directory</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          style={{ height: 42, fontSize: '0.875rem' }}
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add School</>}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-premium p-6 mb-8">
          <h2 className="font-extrabold text-lg mb-5">
            {editingId ? 'Edit School' : 'Add New School'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                School Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Delhi Public School"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Mumbai"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Board
              </label>
              <select
                value={form.board}
                onChange={(e) => setForm({ ...form, board: e.target.value })}
                required
                className="w-full"
              >
                <option value="">Select board</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State">State Board</option>
                <option value="IB">IB</option>
                <option value="IGCSE">IGCSE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary disabled:opacity-50"
              style={{ height: 42, fontSize: '0.875rem' }}
            >
              {isSaving ? 'Saving...' : editingId ? 'Update School' : 'Add School'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-outline"
              style={{ height: 42, fontSize: '0.875rem' }}
            >
              Cancel
            </button>
          </div>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-[var(--accent)] text-sm mt-3">
              Failed to save. Please try again.
            </p>
          )}
        </form>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-light)]" />
        <input
          type="text"
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-[420px] pl-11"
        />
      </div>

      {/* Schools List */}
      <div className="card-premium overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--muted)]">Loading schools...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)]">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">School</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">City</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Board</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Address</th>
                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[var(--muted)]">
                    <School size={36} className="mx-auto mb-3 opacity-30" />
                    {search ? 'No schools match your search' : 'No schools yet. Add one above.'}
                  </td>
                </tr>
              ) : (
                schools.map((school: any) => (
                  <tr key={school.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--muted-extra-light)] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm">{school.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{school.city || '-'}</td>
                    <td className="px-6 py-4">
                      {school.board ? (
                        <span className="badge badge-primary">{school.board}</span>
                      ) : (
                        <span className="text-sm text-[var(--muted)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--muted)]">{school.address || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => startEdit(school)}
                        className="btn btn-outline"
                        style={{ height: 34, fontSize: '0.75rem', padding: '0 12px' }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
