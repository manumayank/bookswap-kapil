'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Hourglass, ArrowLeftRight, Wallet, Search, Inbox, Plus, Phone } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { boardLabel, statusLabel } from '@/lib/labels';
import PageHeader from '@/components/ui/PageHeader';
import StatTile from '@/components/app/StatTile';
import SectionHeader from '@/components/app/SectionHeader';
import ListingThumb from '@/components/app/ListingThumb';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import InlineAlert from '@/components/app/InlineAlert';
import { rupees, statusBadgeClass } from '@/components/app/status';

function listingTitle(listing: any): string {
  return listing?.title || listing?.items?.map((i: any) => i.subject).join(', ') || 'Book set';
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <ErrorState title={`Couldn’t load ${what}`} onRetry={onRetry} />;
}

function RowsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="card-flat divide-y divide-card-border" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="skeleton h-16 w-16" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, hydrate } = useAuthStore();

  const [actionError, setActionError] = useState('');
  const [confirming, setConfirming] = useState<{ id: string; action: 'reject' | 'cancel' } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, router]);

  const { data: listings, isLoading: listingsLoading, isError: listingsError, refetch: refetchListings } = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const { data } = await api.get('/listings/my');
      return data.data;
    },
    retry: false,
  });

  const { data: matches, isLoading: matchesLoading, isError: matchesError, refetch: refetchMatches } = useQuery({
    queryKey: ['myMatches'],
    queryFn: async () => {
      const { data } = await api.get('/matches');
      return data.data;
    },
    retry: false,
  });

  const { data: requests } = useQuery({
    queryKey: ['myRequests'],
    queryFn: async () => {
      const { data } = await api.get('/requests/my');
      return data.data;
    },
    retry: false,
  });

  const onActionError = (err: any) =>
    setActionError(err?.response?.data?.error || 'That action didn’t go through. Please try again.');

  const acceptMutation = useMutation({
    mutationFn: (matchId: string) => api.post(`/matches/${matchId}/accept`),
    onMutate: () => setActionError(''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myMatches'] }),
    onError: onActionError,
  });

  const rejectMutation = useMutation({
    mutationFn: (matchId: string) => api.post(`/matches/${matchId}/reject`),
    onMutate: () => setActionError(''),
    onSuccess: () => {
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
    },
    onError: onActionError,
  });

  const listingsArray: any[] = Array.isArray(listings) ? listings : [];
  const matchesArray: any[] = Array.isArray(matches) ? matches : [];
  const requestsArray: any[] = Array.isArray(requests) ? requests : [];

  const liveCount = listingsArray.filter((l) => l.status === 'ACTIVE').length;
  const pendingApprovalCount = listingsArray.filter((l) => l.status === 'PENDING_APPROVAL').length;
  const openDealsCount = matchesArray.filter((m) => m.status === 'PENDING' || m.status === 'ACCEPTED').length;
  const openRequestsCount = requestsArray.filter((r) => r.status === 'OPEN' || r.status === 'MATCHED').length;

  const incoming = matchesArray.filter((m) => m.status === 'PENDING' && m.sellerId === user?.id);
  const outgoing = matchesArray.filter((m) => m.status === 'PENDING' && m.sellerId !== user?.id);
  const acceptedCount = matchesArray.filter((m) => m.status === 'ACCEPTED').length;
  const completedSales = matchesArray.filter((m) => m.status === 'COMPLETED' && m.sellerId === user?.id);
  const earned = completedSales.reduce(
    (sum, m) => sum + (Number(m.agreedPrice ?? m.listing?.sellingPrice) || 0),
    0,
  );

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const attention: string[] = [];
  if (incoming.length) attention.push(`${plural(incoming.length, 'buyer is', 'buyers are')} waiting for your reply`);
  if (pendingApprovalCount)
    attention.push(`${plural(pendingApprovalCount, 'listing is', 'listings are')} waiting for approval`);
  const summary =
    listingsLoading || matchesLoading
      ? 'Checking your listings and deals.'
      : attention.length
        ? `${attention.join(' and ')}.`.replace(/^./, (c) => c.toUpperCase())
        : 'Nothing needs your attention right now.';

  const statsLoading = listingsLoading || matchesLoading;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={firstName ? `Hi ${firstName}` : 'Your account'}
        description={summary}
        actions={
          <>
            <Link href="/sell" className="btn btn-primary">
              <Plus size={18} aria-hidden="true" />
              List your books
            </Link>
            <Link href="/browse" className="btn btn-outline">
              <Search size={18} aria-hidden="true" />
              Find books
            </Link>
          </>
        }
      />

      {/* Stat tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatTile label="Listings live" value={liveCount} icon={BookOpen} tone="secondary" loading={statsLoading} />
        <StatTile
          label="Pending approval"
          value={pendingApprovalCount}
          icon={Hourglass}
          tone="muted"
          loading={statsLoading}
        />
        <StatTile
          label="Open deals"
          value={openDealsCount}
          icon={ArrowLeftRight}
          tone="primary"
          attention={incoming.length > 0}
          href="/dashboard/deals"
          loading={statsLoading}
        />
        {earned > 0 ? (
          <StatTile label="Earned from sales" value={rupees(earned)} icon={Wallet} tone="secondary" />
        ) : (
          <StatTile label="Open book requests" value={openRequestsCount} icon={Search} tone="muted" loading={statsLoading} />
        )}
      </div>

      {actionError && <InlineAlert onDismiss={() => setActionError('')}>{actionError}</InlineAlert>}

      {/* Needs your reply: incoming deal requests come first */}
      {(matchesLoading || matchesError || incoming.length > 0) && (
        <section aria-labelledby="needs-reply" className="mb-12">
          <SectionHeader
            id="needs-reply"
            title="Needs your reply"
            count={incoming.length}
            description="Parents who want to buy your books. Accept to share contact details with them."
          />
          {matchesLoading ? (
            <RowsSkeleton />
          ) : matchesError ? (
            <LoadError what="your deals" onRetry={() => refetchMatches()} />
          ) : (
            <ul className="card-premium divide-y-2 divide-edge overflow-hidden">
              {incoming.map((match) => {
                const isConfirming = confirming?.id === match.id;
                const accepting = acceptMutation.isPending && acceptMutation.variables === match.id;
                const rejecting = rejectMutation.isPending && rejectMutation.variables === match.id;
                return (
                  <li key={match.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <ListingThumb
                        id={match.listing?.id || match.id}
                        imageUrl={match.listing?.images?.[0]?.imageUrl}
                        category={match.listing?.category}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold">{listingTitle(match.listing)}</p>
                        <p className="text-sm text-muted">
                          {match.buyer?.name || 'A parent'} offered{' '}
                          <span className="font-bold text-foreground">
                            {rupees(match.agreedPrice ?? match.listing?.sellingPrice) || 'your price'}
                          </span>
                        </p>
                        {match.code && <p className="text-[13px] text-muted-light">Deal {match.code}</p>}
                      </div>
                    </div>

                    {isConfirming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Reject this buyer?</span>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-danger"
                          onClick={() => rejectMutation.mutate(match.id)}
                          disabled={rejecting}
                        >
                          {rejecting ? 'Rejecting…' : 'Yes, reject'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirming(null)}
                          disabled={rejecting}
                        >
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                          onClick={() => acceptMutation.mutate(match.id)}
                          disabled={accepting || rejecting}
                        >
                          {accepting ? 'Accepting…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm flex-1 text-danger sm:flex-none"
                          onClick={() => setConfirming({ id: match.id, action: 'reject' })}
                          disabled={accepting || rejecting}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {acceptedCount > 0 && (
        <Link
          href="/dashboard/deals"
          className="card-soft mb-12 flex items-center gap-3 p-4 font-semibold transition-colors hover:bg-card"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-secondary text-ink">
            <Phone size={18} aria-hidden="true" />
          </span>
          <span className="flex-1">
            Contact details are ready for {plural(acceptedCount, 'accepted deal', 'accepted deals')}.
            <span className="block text-sm font-normal text-muted">Open your deals to call or message the other parent.</span>
          </span>
          <span className="hidden text-sm text-primary underline decoration-2 underline-offset-4 sm:inline">See deals</span>
        </Link>
      )}

      {/* Your listings */}
      <section aria-labelledby="your-listings" className="mb-12">
        <SectionHeader
          id="your-listings"
          title="Your listings"
          count={listingsArray.length}
          action={
            listingsArray.length > 0 ? (
              <Link href="/sell" className="btn btn-outline btn-sm">
                <Plus size={16} aria-hidden="true" />
                New listing
              </Link>
            ) : undefined
          }
        />

        {listingsLoading ? (
          <RowsSkeleton rows={3} />
        ) : listingsError ? (
          <LoadError what="your listings" onRetry={() => refetchListings()} />
        ) : listingsArray.length === 0 ? (
          <EmptyState
            size="md"
            icon={BookOpen}
            title="You haven’t listed any books yet"
            description="Give your child’s old textbooks a second life. We check each listing before it goes live."
            actions={
              <Link href="/sell" className="btn btn-primary">
                List your books
              </Link>
            }
          />
        ) : (
          <ul className="card-flat divide-y divide-card-border overflow-hidden">
            {listingsArray.map((listing) => {
              const viewable = listing.status === 'ACTIVE' || listing.status === 'SOLD';
              return (
                <li key={listing.id} className="flex items-center gap-4 p-4">
                  <ListingThumb id={listing.id} imageUrl={listing.images?.[0]?.imageUrl} category={listing.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{listingTitle(listing)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`badge ${statusBadgeClass(listing.status)}`}>{statusLabel(listing.status)}</span>
                      {listing.class && <span className="badge badge-muted">Class {listing.class}</span>}
                      {listing.board && <span className="badge badge-muted">{boardLabel(listing.board)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                    {listing.sellingPrice != null && (
                      <span className="text-lg font-extrabold">{rupees(listing.sellingPrice)}</span>
                    )}
                    {viewable && (
                      <Link href={`/listings/${listing.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Requests the user sent to sellers */}
      {!matchesLoading && !matchesError && (
        <section aria-labelledby="your-requests">
          <SectionHeader
            id="your-requests"
            title="Waiting on sellers"
            count={outgoing.length}
            action={
              <Link href="/dashboard/deals" className="btn btn-ghost btn-sm text-primary">
                All deals
              </Link>
            }
          />
          {outgoing.length === 0 ? (
            <EmptyState
              size="md"
              icon={Inbox}
              title="No requests waiting"
              description="When you ask to buy a listing, it shows here until the seller replies."
              actions={
                <Link href="/browse" className="btn btn-outline">
                  Find books
                </Link>
              }
            />
          ) : (
            <ul className="card-flat divide-y divide-card-border overflow-hidden">
              {outgoing.map((match) => {
                const isConfirming = confirming?.id === match.id;
                const cancelling = rejectMutation.isPending && rejectMutation.variables === match.id;
                return (
                  <li key={match.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <ListingThumb
                        id={match.listing?.id || match.id}
                        imageUrl={match.listing?.images?.[0]?.imageUrl}
                        category={match.listing?.category}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold">{listingTitle(match.listing)}</p>
                        <p className="text-sm text-muted">
                          Your offer{' '}
                          <span className="font-bold text-foreground">
                            {rupees(match.agreedPrice ?? match.listing?.sellingPrice) || '-'}
                          </span>
                          {match.seller?.name ? ` to ${match.seller.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${statusBadgeClass(match.status)} self-start sm:self-center`}>
                      {statusLabel(match.status)}
                    </span>
                    {isConfirming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Cancel this request?</span>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm text-danger"
                          onClick={() => rejectMutation.mutate(match.id)}
                          disabled={cancelling}
                        >
                          {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirming(null)}
                          disabled={cancelling}
                        >
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setConfirming({ id: match.id, action: 'cancel' })}
                      >
                        Cancel request
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
