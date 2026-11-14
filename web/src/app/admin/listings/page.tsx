'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Hourglass, BookOpen, Image as ImageIcon } from 'lucide-react';
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
import { rupees } from '@/components/app/status';

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

  const pendingCount = pendingListings.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        size="md"
        title="Listings"
        description={
          pendingLoading
            ? 'Checking the review queue.'
            : pendingCount
              ? `${pendingCount} waiting for review. Approved listings go live straight away.`
              : 'Nothing waiting for review. Every listing is under All listings.'
        }
      />

      {/* View switch */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Show listings">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          aria-pressed={activeTab === 'pending'}
          className="chip"
        >
          <Hourglass size={16} aria-hidden="true" />
          Waiting for review
          {pendingCount > 0 && (
            <span className="ml-0.5 rounded-full bg-foreground px-2 text-xs font-bold leading-5 text-background">
              {pendingCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('all')} aria-pressed={activeTab === 'all'} className="chip">
          <BookOpen size={16} aria-hidden="true" />
          All listings
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
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="card-flat flex gap-4 p-4">
                  <div className="skeleton h-32 w-28" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-2/3" />
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingIsError ? (
            <ErrorState error={pendingError} onRetry={() => refetchPending()} title="Couldn’t load the review queue" />
          ) : pendingListings.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No listings are waiting for review. New ones appear here as parents submit them."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
          {allIsError ? (
            <ErrorState error={allError} onRetry={() => refetchAll()} title="Couldn’t load listings" />
          ) : (
            <>
              <div className={TABLE_WRAP}>
                {allLoading ? (
                  <div className="p-12 text-center text-sm text-muted">Loading listings…</div>
                ) : allListings.length === 0 ? (
                  <EmptyState bare icon={BookOpen} title="No listings yet" description="Listings appear here once parents add them." />
                ) : (
                  <table className={TABLE}>
                    <thead>
                      <tr>
                        <th className={TH}>Listing</th>
                        <th className={TH}>Seller</th>
                        <th className={TH}>Category</th>
                        <th className={TH_RIGHT}>Price</th>
                        <th className={TH}>Condition</th>
                        <th className={TH}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allListings.map((listing: any) => (
                        <tr key={listing.id} className={TR}>
                          <td className={TD}>
                            <span className="font-bold">{listing.title}</span>
                          </td>
                          <td className={`${TD} text-muted`}>{listing.user?.name || listing.seller?.name || '-'}</td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <span className="badge badge-muted">{enumLabel(listing.category || listing.board)}</span>
                          </td>
                          <td className={`${TD_RIGHT} whitespace-nowrap font-bold tabular-nums`}>
                            {listing.sellingPrice != null ? rupees(listing.sellingPrice) : '-'}
                          </td>
                          <td className={`${TD} whitespace-nowrap text-muted`}>{enumLabel(listing.condition)}</td>
                          <td className={`${TD} whitespace-nowrap`}>
                            <StatusBadge status={listing.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {allPagination && (
                <Pagination page={allPage} totalPages={allPagination.totalPages} onChange={setAllPage} />
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
        pendingLabel="Rejecting…"
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
  const firstImageUrl: string | undefined =
    typeof firstImage === 'string' ? firstImage : firstImage?.imageUrl ?? firstImage?.url;
  const busy = isApproving || isRejecting;

  return (
    <article className="card-flat flex flex-col overflow-hidden sm:flex-row">
      {/* Image */}
      <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden border-b-2 border-edge bg-muted-extra-light sm:h-auto sm:min-h-[200px] sm:w-40 sm:border-b-0 sm:border-r-2">
        {firstImageUrl ? (
          <img src={firstImageUrl} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted">
            <ImageIcon size={28} aria-hidden="true" />
            <span className="text-[13px] font-semibold">No photo</span>
          </span>
        )}
        {images.length > 1 && (
          <span className="badge badge-muted absolute bottom-2 left-2 bg-card">{images.length} photos</span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold leading-snug">{listing.title}</h3>
            {listing.sellingPrice != null && (
              <span className="shrink-0 text-lg font-extrabold">{rupees(listing.sellingPrice)}</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            Listed by {listing.user?.name || listing.seller?.name || 'unknown seller'}
            {listing.city ? ` in ${listing.city}` : ''}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.category && <span className="badge badge-muted">{enumLabel(listing.category)}</span>}
            {listing.class && <span className="badge badge-muted">Class {listing.class}</span>}
            {listing.board && <span className="badge badge-muted">{enumLabel(listing.board)}</span>}
            {listing.condition && <span className="badge badge-primary">{enumLabel(listing.condition)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2 border-t border-card-border pt-4 sm:flex-row">
          <button type="button" onClick={onApprove} disabled={busy} className="btn btn-secondary btn-sm flex-1">
            <CheckCircle2 size={16} aria-hidden="true" />
            {isApproving ? 'Approving…' : 'Approve listing'}
          </button>
          <button type="button" onClick={onReject} disabled={busy} className="btn btn-outline btn-sm flex-1 text-accent">
            <XCircle size={16} aria-hidden="true" />
            {isRejecting ? 'Rejecting…' : 'Reject listing'}
          </button>
        </div>
      </div>
    </article>
  );
}
