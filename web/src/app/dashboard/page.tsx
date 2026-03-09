'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: 'background: rgba(234, 179, 8, 0.15); color: #a16207;',
  ACTIVE: 'background: rgba(16, 185, 129, 0.15); color: #047857;',
  SOLD: 'background: rgba(99, 102, 241, 0.15); color: #4338ca;',
  REJECTED: 'background: rgba(244, 63, 94, 0.15); color: #be123c;',
  CANCELLED: 'background: rgba(113, 113, 122, 0.15); color: #52525b;',
  EXCHANGED: 'background: rgba(99, 102, 241, 0.15); color: #4338ca;',
};

const DEAL_STATUS_STYLES: Record<string, string> = {
  PENDING: 'background: rgba(234, 179, 8, 0.15); color: #a16207;',
  ACCEPTED: 'background: rgba(16, 185, 129, 0.15); color: #047857;',
  COMPLETED: 'background: rgba(99, 102, 241, 0.15); color: #4338ca;',
  REJECTED: 'background: rgba(244, 63, 94, 0.15); color: #be123c;',
  CANCELLED: 'background: rgba(113, 113, 122, 0.15); color: #52525b;',
};

function StatusBadge({ status, styleMap }: { status: string; styleMap: Record<string, string> }) {
  const style = styleMap[status] || styleMap['CANCELLED'] || '';
  return (
    <span className="badge" style={Object.fromEntries(style.split(';').filter(Boolean).map(s => {
      const [k, v] = s.split(':').map(x => x.trim());
      const camelKey = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return [camelKey, v];
    }))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, router]);

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: async () => {
      const { data } = await api.get('/listings/my');
      return data.data;
    },
    retry: false,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
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
      const { data } = await api.get('/requests');
      return data.data;
    },
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: (matchId: string) => api.post(`/matches/${matchId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myMatches'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (matchId: string) => api.post(`/matches/${matchId}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myMatches'] }),
  });

  const listingsArray = Array.isArray(listings) ? listings : [];
  const matchesArray = Array.isArray(matches) ? matches : [];
  const requestsArray = Array.isArray(requests) ? requests : [];

  const myListingsCount = listingsArray.length;
  const activeDealsCount = matchesArray.filter(
    (m: any) => m.status === 'PENDING' || m.status === 'ACCEPTED'
  ).length;
  const openRequestsCount = requestsArray.filter(
    (r: any) => r.status === 'OPEN' || r.status === 'MATCHED'
  ).length;

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
          Welcome{user ? `, ${user.name}` : ''}!
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
          Manage your book listings, deals, and requests from here.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card-premium" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)' }}>
            {myListingsCount}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            My Listings
          </div>
        </div>
        <div className="card-premium" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
            {activeDealsCount}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Active Deals
          </div>
        </div>
        <div className="card-premium" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent)' }}>
            {openRequestsCount}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Open Requests
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <Link href="/sell" className="btn btn-primary">
          Sell a Book
        </Link>
        <Link href="/browse" className="btn btn-outline">
          Browse Books
        </Link>
        <Link href="/dashboard/requests/new" className="btn btn-outline">
          Request a Book
        </Link>
      </div>

      {/* My Listings Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>My Listings</h2>
          <Link href="/sell" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            + New Listing
          </Link>
        </div>

        {listingsLoading ? (
          <div className="card-premium" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            Loading listings...
          </div>
        ) : listingsArray.length === 0 ? (
          <div className="card-premium" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            No listings yet.{' '}
            <Link href="/sell" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="grid-marketplace">
            {listingsArray.map((listing: any) => {
              const title =
                listing.title ||
                listing.items?.map((i: any) => i.subject).join(', ') ||
                'Book Set';
              return (
                <div key={listing.id} className="card-premium" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, flex: 1, marginRight: '0.5rem' }}>
                      {title}
                    </h3>
                    <StatusBadge status={listing.status} styleMap={STATUS_STYLES} />
                  </div>
                  {listing.price != null && (
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{listing.price}
                    </div>
                  )}
                  <div style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
                    {listing.condition?.replace(/_/g, ' ') || 'N/A'}
                    {listing.board && ` · ${listing.board}`}
                    {listing.class && ` · Class ${listing.class}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* My Deals Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>My Deals</h2>

        {matchesLoading ? (
          <div className="card-premium" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            Loading deals...
          </div>
        ) : matchesArray.length === 0 ? (
          <div className="card-premium" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            No deals yet. Create listings or browse books to get matched!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matchesArray.map((match: any) => {
              const isGiver = match.giverId === user?.id;
              const role = isGiver ? 'Seller' : 'Buyer';
              const listingTitle =
                match.listing?.title ||
                match.listing?.items?.map((i: any) => i.subject).join(', ') ||
                'Book Set';

              return (
                <div key={match.id} className="card-premium" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-primary">{role}</span>
                        <StatusBadge status={match.status} styleMap={DEAL_STATUS_STYLES} />
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        {listingTitle}
                      </h3>
                      {match.agreedPrice != null && (
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                          ₹{match.agreedPrice}
                        </div>
                      )}
                      <div style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                        {isGiver ? 'Giving to' : 'Receiving from'}{' '}
                        {(isGiver ? match.receiver?.name : match.giver?.name) || 'Unknown'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {match.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isGiver ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ height: '40px', fontSize: '0.8125rem', padding: '0 16px' }}
                              onClick={() => acceptMutation.mutate(match.id)}
                              disabled={acceptMutation.isPending}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ height: '40px', fontSize: '0.8125rem', padding: '0 16px', color: 'var(--accent)' }}
                              onClick={() => rejectMutation.mutate(match.id)}
                              disabled={rejectMutation.isPending}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-outline"
                            style={{ height: '40px', fontSize: '0.8125rem', padding: '0 16px', color: 'var(--accent)' }}
                            onClick={() => rejectMutation.mutate(match.id)}
                            disabled={rejectMutation.isPending}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
