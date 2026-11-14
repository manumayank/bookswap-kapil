'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, BookOpen, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ConfirmDialog from '../_components/ConfirmDialog';
import ErrorState, { InlineError } from '../_components/ErrorState';
import StatusBadge from '../_components/StatusBadge';
import { enumLabel } from '../_components/labels';

type Tab = 'pending' | 'all';

export default function AdminListingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [allPage, setAllPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null);

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

  // Fetch pending listings
  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingIsError,
    error: pendingError,
    refetch: refetchPending,
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
    isError: allIsError,
    error: allError,
    refetch: refetchAll,
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
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.put(`/admin/listings/${id}/reject`, { reason }),
    onSuccess: () => {
      setRejectTarget(null);
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
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTab('pending')}
          aria-pressed={activeTab === 'pending'}
          className={`btn h-10 px-4 text-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Clock size={16} />
          Pending Review
          {pendingListings.length > 0 && (
            <span
              className={`ml-1.5 text-xs font-bold rounded-full px-2 py-0.5 ${
                activeTab === 'pending'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--primary)] text-white'
              }`}
            >
              {pendingListings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          aria-pressed={activeTab === 'all'}
          className={`btn h-10 px-4 text-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          <BookOpen size={16} />
          All Listings
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div>
          {approveMutation.isError && (
            <div className="mb-4">
              <InlineError error={approveMutation.error} />
            </div>
          )}
          {pendingLoading ? (
            <div className="card-flat p-12 text-center text-[var(--muted)]">
              Loading pending listings...
            </div>
          ) : pendingIsError ? (
            <ErrorState error={pendingError} onRetry={() => refetchPending()} title="Could not load pending listings" />
          ) : pendingListings.length === 0 ? (
            <div className="card-flat p-12 text-center">
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
                  onReject={() => {
                    rejectMutation.reset();
                    setRejectTarget({ id: listing.id, title: listing.title });
                  }}
                  isApproving={approveMutation.isPending && approveMutation.variables === listing.id}
                  isRejecting={rejectMutation.isPending && rejectMutation.variables?.id === listing.id}
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
            <div className="card-flat p-12 text-center text-[var(--muted)]">
              Loading listings...
            </div>
          ) : allIsError ? (
            <ErrorState error={allError} onRetry={() => refetchAll()} title="Could not load listings" />
          ) : allListings.length === 0 ? (
            <div className="card-flat p-12 text-center text-[var(--muted)]">
              No listings found.
            </div>
          ) : (
            <>
              <div className="card-flat overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Title</th>
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Seller</th>
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Category</th>
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Price</th>
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Condition</th>
                      <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">Status</th>
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
                          <span className="badge badge-primary whitespace-nowrap">{enumLabel(listing.category || listing.board)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                          {listing.sellingPrice != null ? `\u20B9${listing.sellingPrice}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--muted)] whitespace-nowrap">{enumLabel(listing.condition)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                    className="btn btn-outline h-10 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-[var(--muted)]">
                    Page {allPage} of {allPagination.totalPages}
                  </span>
                  <button
                    onClick={() => setAllPage(Math.min(allPagination.totalPages, allPage + 1))}
                    disabled={allPage >= allPagination.totalPages}
                    className="btn btn-outline h-10 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject this listing?"
        message={rejectTarget ? <>&ldquo;{rejectTarget.title}&rdquo; will be rejected and won&rsquo;t go live.</> : null}
        confirmLabel="Reject listing"
        pendingLabel="Rejecting..."
        tone="danger"
        withReason
        reasonPlaceholder="e.g. Photos are unclear (shared with the seller)"
        isPending={rejectMutation.isPending}
        error={rejectMutation.error}
        onCancel={() => {
          setRejectTarget(null);
          rejectMutation.reset();
        }}
        onConfirm={(reason) => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason })}
      />
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
    <div className="card-flat overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="w-full h-40 sm:w-36 sm:h-auto sm:min-h-[180px] bg-[var(--muted-extra-light)] flex-shrink-0 flex items-center justify-center overflow-hidden">
          {firstImage ? (
            <img
              src={typeof firstImage === 'string' ? firstImage : firstImage.imageUrl ?? firstImage.url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={32} className="text-[var(--muted)]" aria-hidden="true" />
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
                <span className="badge badge-primary">{enumLabel(listing.category)}</span>
              )}
              {listing.board && (
                <span className="badge badge-primary">{enumLabel(listing.board)}</span>
              )}
              {listing.condition && (
                <span className="badge badge-secondary">{enumLabel(listing.condition)}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              {listing.sellingPrice != null && (
                <span className="font-bold text-[var(--foreground)]">{'\u20B9'}{listing.sellingPrice}</span>
              )}
              {listing.city && <span>{listing.city}</span>}
              {listing.class && <span>Class {listing.class}</span>}
            </div>

            {images.length > 1 && (
              <p className="text-xs text-[var(--muted)] mt-2">{images.length} images attached</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--card-border)]">
            <button
              onClick={onApprove}
              disabled={isApproving || isRejecting}
              className="btn btn-secondary flex-1 h-10 px-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              {isApproving ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={onReject}
              disabled={isApproving || isRejecting}
              className="btn btn-outline flex-1 h-10 px-3 text-sm border-[var(--accent)] text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
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
