'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface Deal {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  agreedPrice: number;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    sellingPrice: number;
    images: { imageUrl: string }[];
  };
  buyer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city: string;
  };
  seller: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city: string;
  };
}

export default function DealsPage() {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  // Destructive actions (reject / cancel) need a second click to confirm
  const [confirming, setConfirming] = useState<{ id: string; kind: 'reject' | 'cancelInterest' | 'cancelDeal' } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab]);

  async function fetchDeals() {
    setLoading(true);
    setLoadError('');
    try {
      const endpoint = activeTab === 'buying' ? '/deals/my/buying' : '/deals/my/selling';
      const { data } = await api.get(endpoint);
      setDeals(data.data || []);
    } catch (err: any) {
      setDeals([]);
      setLoadError(err?.response?.data?.error || 'Could not load your deals.');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(dealId: string, request: () => Promise<unknown>, failMessage: string) {
    setActionLoading(dealId);
    setActionError('');
    try {
      await request();
      setConfirming(null);
      fetchDeals();
    } catch (err: any) {
      setActionError(err?.response?.data?.error || failMessage);
    } finally {
      setActionLoading(null);
    }
  }

  const handleRespond = (dealId: string, status: 'ACCEPTED' | 'REJECTED') =>
    runAction(dealId, () => api.post(`/deals/${dealId}/respond`, { status }), 'Could not update the deal. Please try again.');

  const handleComplete = (dealId: string, status: 'COMPLETED' | 'CANCELLED') =>
    runAction(dealId, () => api.post(`/deals/${dealId}/complete`, { status }), 'Could not update the deal. Please try again.');

  const handleCancel = (dealId: string) =>
    runAction(dealId, () => api.post(`/deals/${dealId}/cancel`), 'Could not cancel your interest. Please try again.');

  function confirmAction(deal: Deal) {
    if (!confirming) return;
    if (confirming.kind === 'reject') handleRespond(deal.id, 'REJECTED');
    else if (confirming.kind === 'cancelInterest') handleCancel(deal.id);
    else handleComplete(deal.id, 'CANCELLED');
  }

  const CONFIRM_TEXT = {
    reject: 'Reject this buyer?',
    cancelInterest: 'Withdraw your interest?',
    cancelDeal: 'Cancel this accepted deal?',
  } as const;

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return { bg: 'rgb(var(--primary-rgb) / 0.12)', color: 'var(--badge-primary-text)' };
      case 'ACCEPTED': return { bg: 'rgb(var(--secondary-rgb) / 0.12)', color: 'var(--badge-secondary-text)' };
      case 'COMPLETED': return { bg: 'rgb(var(--secondary-rgb) / 0.15)', color: 'var(--badge-secondary-text)' };
      case 'REJECTED':
      case 'CANCELLED': return { bg: 'rgb(var(--accent-rgb) / 0.12)', color: 'var(--accent)' };
      default: return { bg: 'var(--muted-extra-light)', color: 'var(--muted)' };
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'ACCEPTED': return 'Accepted - Exchange Pending';
      case 'COMPLETED': return 'Completed';
      case 'REJECTED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  if (!isHydrated) {
    return (
      <div aria-busy="true">
        <div className="h-10 skeleton w-48 mb-3" />
        <div className="h-5 skeleton w-64 mb-8" />
        <div className="h-40 skeleton rounded-[28px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Please login to view your deals</h2>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>My Deals</h1>
        <p style={{ color: 'var(--muted)' }}>Manage your book exchanges</p>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Deal type" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'buying'}
          onClick={() => setActiveTab('buying')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'buying' ? 'var(--primary)' : 'var(--muted-extra-light)',
            color: activeTab === 'buying' ? 'white' : 'var(--foreground)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          I&apos;m Buying ({activeTab === 'buying' ? deals.length : '-'})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'selling'}
          onClick={() => setActiveTab('selling')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'selling' ? 'var(--primary)' : 'var(--muted-extra-light)',
            color: activeTab === 'selling' ? 'white' : 'var(--foreground)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          I&apos;m Selling ({activeTab === 'selling' ? deals.length : '-'})
        </button>
      </div>

      {actionError && (
        <div role="alert" className="mb-4 p-4 rounded-xl bg-accent/10 text-accent font-medium flex items-start justify-between gap-4">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError('')} aria-label="Dismiss error" className="font-black px-2">
            &times;
          </button>
        </div>
      )}

      {/* Deals List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading deals...</p>
        </div>
      ) : loadError ? (
        <div role="alert" className="card-flat p-8 text-center">
          <p className="text-accent font-semibold mb-4">{loadError}</p>
          <button type="button" onClick={fetchDeals} className="btn btn-outline h-11">
            Try again
          </button>
        </div>
      ) : deals.length === 0 ? (
        <div className="card-flat" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
          <h3>No deals yet</h3>
          <p style={{ color: 'var(--muted)' }}>
            {activeTab === 'buying' 
              ? 'Browse listings and express interest to start a deal'
              : 'When someone is interested in your listings, deals will appear here'}
          </p>
          <Link 
            href={activeTab === 'buying' ? '/browse' : '/sell'} 
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            {activeTab === 'buying' ? 'Browse Listings' : 'List an Item'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {deals.map((deal) => {
            const statusStyle = getStatusColor(deal.status);
            const isSeller = activeTab === 'selling';
            const otherParty = isSeller ? deal.buyer : deal.seller;
            const showContact = deal.status === 'ACCEPTED' || deal.status === 'COMPLETED';

            return (
              <div key={deal.id} className="card-flat" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Listing Image */}
                  <Link href={`/listings/${deal.listing.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--muted-extra-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      overflow: 'hidden',
                    }}>
                      {deal.listing.images?.[0] ? (
                        <img src={deal.listing.images[0].imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '📚'
                      )}
                    </div>
                  </Link>

                  {/* Deal Info */}
                  <div style={{ flex: 1, minWidth: 'min(250px, 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <Link href={`/listings/${deal.listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{deal.listing.title}</h3>
                      </Link>
                      <span style={{ 
                        padding: '4px 12px', 
                        background: statusStyle.bg, 
                        color: statusStyle.color,
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {getStatusText(deal.status)}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{deal.agreedPrice}
                    </p>

                    {/* Other Party Info */}
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--muted-extra-light)', 
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {isSeller ? 'Buyer' : 'Seller'}
                      </p>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {showContact ? otherParty.name : `${otherParty.name.charAt(0)}***`}
                        {!showContact && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                            (Contact revealed after acceptance)
                          </span>
                        )}
                      </p>
                      
                      {showContact && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                          {otherParty.phone && (
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
                              📞 {otherParty.phone}
                            </p>
                          )}
                          {otherParty.email && (
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>
                              ✉️ {otherParty.email}
                            </p>
                          )}
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                            📍 {otherParty.city}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {confirming?.id === deal.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{CONFIRM_TEXT[confirming.kind]}</span>
                      <button
                        type="button"
                        onClick={() => confirmAction(deal)}
                        disabled={actionLoading === deal.id}
                        className="btn btn-outline"
                        style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                      >
                        {actionLoading === deal.id ? 'Working...' : 'Yes, confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={actionLoading === deal.id}
                        className="btn btn-outline"
                        style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem' }}
                      >
                        Go back
                      </button>
                    </div>
                    ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {deal.status === 'PENDING' && isSeller && (
                        <>
                          <button
                            onClick={() => handleRespond(deal.id, 'ACCEPTED')}
                            disabled={actionLoading === deal.id}
                            className="btn btn-primary"
                            style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem' }}
                          >
                            {actionLoading === deal.id ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming({ id: deal.id, kind: 'reject' })}
                            disabled={actionLoading === deal.id}
                            className="btn btn-outline"
                            style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}

                      {deal.status === 'PENDING' && !isSeller && (
                        <button
                          type="button"
                          onClick={() => setConfirming({ id: deal.id, kind: 'cancelInterest' })}
                          disabled={actionLoading === deal.id}
                          className="btn btn-outline"
                          style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem' }}
                        >
                          Cancel Interest
                        </button>
                      )}

                      {deal.status === 'ACCEPTED' && (
                        <>
                          <button
                            onClick={() => handleComplete(deal.id, 'COMPLETED')}
                            disabled={actionLoading === deal.id}
                            className="btn btn-primary"
                            style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem' }}
                          >
                            ✓ Mark Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming({ id: deal.id, kind: 'cancelDeal' })}
                            disabled={actionLoading === deal.id}
                            className="btn btn-outline"
                            style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                          >
                            Cancel Deal
                          </button>
                        </>
                      )}

                      {deal.status === 'COMPLETED' && (
                        <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                          ✓ Deal completed successfully
                        </span>
                      )}

                      {(deal.status === 'REJECTED' || deal.status === 'CANCELLED') && (
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          This deal was cancelled
                        </span>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
