'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  ClipboardList,
  ArrowLeftRight,
  CheckCircle2,
  Hourglass,
  School,
  MessageSquareWarning,
  ChevronRight,
  Search,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import ErrorState from '../_components/ErrorState';
import { enumLabel } from '../_components/labels';
import PageHeader from '@/components/app/PageHeader';
import StatTile from '@/components/app/StatTile';
import SectionHeader from '@/components/app/SectionHeader';
import ListingThumb from '@/components/app/ListingThumb';
import { rupees } from '@/components/app/status';

const QUEUE_PREVIEW = 4;

export default function AdminDashboard() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Wait for Zustand to finish hydrating from localStorage before deciding to
  // redirect. Without this guard the effect fires on the initial render (when
  // user is null) and bounces every legitimate admin to /login.
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

  const { data: stats, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
    enabled: !!user?.isAdmin,
  });

  // Same key as the Listings page so the queue is shared from cache.
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

  if (!user?.isAdmin) return null;

  const pending: any[] = pendingData?.data || [];
  const pendingListings: number = stats?.pendingListings ?? pending.length;
  const pendingRequests: number = stats?.pendingRequests ?? 0;
  const value = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('en-IN') : '-');

  const waiting: string[] = [];
  if (pendingListings) waiting.push(`${pendingListings} ${pendingListings === 1 ? 'listing' : 'listings'}`);
  if (pendingRequests) waiting.push(`${pendingRequests} ${pendingRequests === 1 ? 'request' : 'requests'}`);
  const summary = isLoading
    ? 'Loading today’s numbers.'
    : waiting.length
      ? `${waiting.join(' and ')} waiting for review.`
      : 'Nothing is waiting for review.';

  const quickLinks = [
    { href: '/admin/listings', label: 'Review listings', hint: 'Approve or reject new listings', icon: BookOpen, count: pendingListings },
    { href: '/admin/requests', label: 'Review requests', hint: 'Approve book requests from parents', icon: ClipboardList, count: pendingRequests },
    { href: '/admin/grievances', label: 'Grievances', hint: 'Reports from parents about deals', icon: MessageSquareWarning },
    { href: '/admin/users', label: 'Users', hint: 'Search registered parents', icon: Search },
    { href: '/admin/schools', label: 'Schools', hint: 'Add or edit schools', icon: School },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader size="md" title="Dashboard" description={summary} />

      {isError && (
        <div className="mb-8">
          <ErrorState error={error} onRetry={() => refetch()} title="Couldn’t load stats" />
        </div>
      )}

      {/* Stat tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatTile
          label="Listings to review"
          value={value(stats?.pendingListings)}
          icon={Hourglass}
          attention={pendingListings > 0}
          href="/admin/listings"
          loading={isLoading}
        />
        <StatTile
          label="Requests to review"
          value={value(stats?.pendingRequests)}
          icon={ClipboardList}
          tone="muted"
          href="/admin/requests"
          loading={isLoading}
        />
        <StatTile label="Active listings" value={value(stats?.activeListings)} icon={BookOpen} tone="secondary" loading={isLoading} />
        <StatTile label="Open requests" value={value(stats?.openRequests)} icon={ClipboardList} tone="primary" loading={isLoading} />
        <StatTile label="Users" value={value(stats?.totalUsers)} icon={Users} tone="primary" loading={isLoading} />
        <StatTile label="Deals" value={value(stats?.deals)} icon={ArrowLeftRight} tone="muted" loading={isLoading} />
        <StatTile label="Completed deals" value={value(stats?.completedDeals)} icon={CheckCircle2} tone="secondary" loading={isLoading} />
        {typeof stats?.schools === 'number' && (
          <StatTile label="Schools" value={value(stats.schools)} icon={School} tone="muted" href="/admin/schools" />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Review queue preview */}
        <section aria-labelledby="queue">
          <SectionHeader
            id="queue"
            title="Waiting for review"
            count={pending.length}
            action={
              pending.length > 0 ? (
                <Link href="/admin/listings" className="btn btn-outline btn-sm">
                  Open queue
                </Link>
              ) : undefined
            }
          />
          {pendingLoading ? (
            <div className="card-flat divide-y divide-card-border" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="skeleton h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingIsError ? (
            <ErrorState error={pendingError} onRetry={() => refetchPending()} title="Couldn’t load the review queue" />
          ) : pending.length === 0 ? (
            <div className="card-flat flex items-center gap-3 p-5">
              <CheckCircle2 size={22} className="shrink-0 text-secondary-dark" aria-hidden="true" />
              <p className="text-sm">
                <span className="font-semibold">All caught up.</span>{' '}
                <span className="text-muted">New listings appear here before they go live.</span>
              </p>
            </div>
          ) : (
            <ul className="card-flat divide-y divide-card-border overflow-hidden">
              {pending.slice(0, QUEUE_PREVIEW).map((listing) => {
                const img = listing.images?.[0];
                return (
                  <li key={listing.id}>
                    <Link
                      href="/admin/listings"
                      className="flex min-h-[64px] items-center gap-3 px-3 py-2 transition-colors hover:bg-muted-extra-light"
                    >
                      <ListingThumb
                        id={listing.id}
                        size="sm"
                        category={listing.category}
                        imageUrl={typeof img === 'string' ? img : img?.imageUrl ?? img?.url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{listing.title}</p>
                        <p className="truncate text-[13px] text-muted">
                          {listing.user?.name || listing.seller?.name || 'Unknown seller'}
                          {listing.class ? `, Class ${listing.class}` : ''}
                          {listing.board ? `, ${enumLabel(listing.board)}` : ''}
                        </p>
                      </div>
                      {listing.sellingPrice != null && (
                        <span className="shrink-0 text-sm font-bold">{rupees(listing.sellingPrice)}</span>
                      )}
                      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
              {pending.length > QUEUE_PREVIEW && (
                <li className="px-4 py-3 text-sm text-muted">
                  {pending.length - QUEUE_PREVIEW} more in the queue
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Quick links */}
        <section aria-labelledby="shortcuts">
          <SectionHeader id="shortcuts" title="Go to" />
          <ul className="card-flat divide-y divide-card-border overflow-hidden">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-[60px] items-center gap-3 px-4 py-2 transition-colors hover:bg-muted-extra-light"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted-extra-light text-foreground">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{link.label}</span>
                      <span className="block truncate text-[13px] text-muted">{link.hint}</span>
                    </span>
                    {!!link.count && <span className="badge badge-sun">{link.count}</span>}
                    <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
