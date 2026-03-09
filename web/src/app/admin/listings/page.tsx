'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, BookOpen, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

type Tab = 'pending' | 'all';

export default function AdminListingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [allPage, setAllPage] = useState(1);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  // Fetch pending listings
  const {
    data: pendingData,
    isLoading: pendingLoading,
  } = useQuery({
    queryKey: ['admin-listings-pending'],
    queryFn: async () => {
      const { data } = await api.get('/admin/listings/pending');
      return data;
    },
    enabled: !!user?.isAdmin,
  });

  // Fetch all listings
  const {
    data: allData,
    isLoading: allLoading,
  } = useQuery({
    queryKey: ['admin-listings-all', allPage],
    queryFn: async () => {
      const { data } = await api.get('/admin/listings', { params: { page: allPage, limit: 20 } });
      return data;
    },
    enabled: !!user?.isAdmin && activeTab === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/listings/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/listings/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const pendingListings = pendingData?.data || [];
  const allListings = allData?.data || [];
  const allPagination = allData?.pagination;

  if (!user?.isAdmin) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Listings</h1>
        <p className="text-[var(--muted)]">Review, approve, and manage all book listings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('pending')}
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: 42, fontSize: '0.875rem' }}
        >
          <Clock size={16} />
          Pending Review
          {pendingListings.length > 0 && (
            <span className="ml-1.5 bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {pendingListings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: 42, fontSize: '0.875rem' }}
        >
          <BookOpen size={16} />
          All Listings
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingLoading ? (
            <div className="card-premium p-12 text-center text-[var(--muted)]">
              Loading pending listings...
            </div>
          ) : pendingListings.length === 0 ? (
            <div className="card-premium p-12 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-[var(--secondary)]" />
              <p className="text-lg font-bold mb-1">All caught up!</p>
              <p className="text-sm text-[var(--muted)]">No listings are waiting for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingListings.map((listing: any) => (
                <PendingListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={() => approveMutation.mutate(listing.id)}
                  onReject={() => rejectMutation.mutate(listing.id)}
                  isApproving={approveMutation.isPending && approveMutation.variables === listing.id}
                  isRejecting={rejectMutation.isPending && rejectMutation.variables === listing.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Listings Tab */}
      {activeTab === 'all' && (
        <div>
          {allLoading ? (
            <div className="card-premium p-12 text-center text-[var(--muted)]">
              Loading listings...
            </div>
          ) : allListings.length === 0 ? (
            <div className="card-premium p-12 text-center text-[var(--muted)]">
              No listings found.
            </div>
          ) : (
            <>
              <div className="card-premium overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Title</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Seller</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Category</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Price</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Condition</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allListings.map((listing: any) => (
                      <tr key={listing.id} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--muted-extra-light)] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-sm">{listing.title}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--muted)]">
                          {listing.user?.name || listing.seller?.name || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-primary">{listing.category || listing.board || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          {listing.sellingPrice != null ? `\u20B9${listing.sellingPrice}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--muted)]">{listing.condition || '-'}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={listing.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {allPagination && allPagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setAllPage(Math.max(1, allPage - 1))}
                    disabled={allPage === 1}
                    className="btn btn-outline disabled:opacity-40"
                    style={{ height: 40, fontSize: '0.875rem' }}
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-[var(--muted)]">
                    Page {allPage} of {allPagination.totalPages}
                  </span>
                  <button
                    onClick={() => setAllPage(Math.min(allPagination.totalPages, allPage + 1))}
                    disabled={allPage >= allPagination.totalPages}
                    className="btn btn-outline disabled:opacity-40"
                    style={{ height: 40, fontSize: '0.875rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PendingListingCard({
  listing,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  listing: any;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const images = listing.images || listing.imageUrls || [];
  const firstImage = images[0];

  return (
    <div className="card-premium overflow-hidden">
      <div className="flex">
        {/* Image */}
        <div className="w-36 min-h-[180px] bg-[var(--muted-extra-light)] flex-shrink-0 flex items-center justify-center overflow-hidden">
          {firstImage ? (
            <img
              src={typeof firstImage === 'string' ? firstImage : firstImage.url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={32} className="text-[var(--muted-light)]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex-1">
            <h3 className="font-extrabold text-base mb-1 leading-tight">{listing.title}</h3>
            <p className="text-sm text-[var(--muted)] mb-3">
              by {listing.user?.name || listing.seller?.name || 'Unknown'}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {listing.category && (
                <span className="badge badge-primary">{listing.category}</span>
              )}
              {listing.board && (
                <span className="badge badge-primary">{listing.board}</span>
              )}
              {listing.condition && (
                <span className="badge badge-secondary">{listing.condition}</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              {listing.sellingPrice != null && (
                <span className="font-bold text-[var(--foreground)]">{'\u20B9'}{listing.sellingPrice}</span>
              )}
              {listing.city && <span>{listing.city}</span>}
              {listing.class && <span>Class {listing.class}</span>}
            </div>

            {images.length > 1 && (
              <p className="text-xs text-[var(--muted-light)] mt-2">{images.length} images attached</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={onApprove}
              disabled={isApproving || isRejecting}
              className="btn btn-secondary disabled:opacity-50"
              style={{ height: 38, fontSize: '0.8125rem', flex: 1 }}
            >
              <CheckCircle size={16} />
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              disabled={isApproving || isRejecting}
              className="btn btn-outline disabled:opacity-50"
              style={{ height: 38, fontSize: '0.8125rem', flex: 1, borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <XCircle size={16} />
              {isRejecting ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600',
    PENDING: 'bg-amber-500/10 text-amber-600',
    APPROVED: 'bg-emerald-500/10 text-emerald-600',
    REJECTED: 'bg-red-500/10 text-red-600',
    SOLD: 'bg-blue-500/10 text-blue-600',
    CANCELLED: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <span className={`badge ${styles[status] || 'bg-gray-500/10 text-gray-500'}`}>
      {status}
    </span>
  );
}
