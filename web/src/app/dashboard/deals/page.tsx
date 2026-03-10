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
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
    }
  }, [isAuthenticated, activeTab]);

  async function fetchDeals() {
    setLoading(true);
    try {
      const endpoint = activeTab === 'buying' ? '/deals/my/buying' : '/deals/my/selling';
      const { data } = await api.get(endpoint);
      setDeals(data.data || []);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(dealId: string, status: 'ACCEPTED' | 'REJECTED') {
    setActionLoading(dealId);
    try {
      await api.post(`/deals/${dealId}/respond`, { status });
      fetchDeals();
    } catch (err) {
      console.error('Failed to respond:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(dealId: string, status: 'COMPLETED' | 'CANCELLED') {
    setActionLoading(dealId);
    try {
      await api.post(`/deals/${dealId}/complete`, { status });
      fetchDeals();
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(dealId: string) {
    setActionLoading(dealId);
    try {
      await api.post(`/deals/${dealId}/cancel`);
      fetchDeals();
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return { bg: 'var(--primary-glow)', color: 'var(--primary)' };
      case 'ACCEPTED': return { bg: 'var(--secondary-glow)', color: 'var(--secondary)' };
      case 'COMPLETED': return { bg: '#dcfce7', color: '#166534' };
      case 'REJECTED':
      case 'CANCELLED': return { bg: 'var(--accent-glow)', color: 'var(--accent)' };
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

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Please login to view your deals</h2>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
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

      {/* Deals List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="card-premium" style={{ padding: '4rem', textAlign: 'center' }}>
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
            style={{ marginTop: '1.5rem', display: 'inline-block' }}
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
              <div key={deal.id} className="card-premium" style={{ padding: '1.5rem' }}>
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
                  <div style={{ flex: 1, minWidth: '250px' }}>
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
                            onClick={() => handleRespond(deal.id, 'REJECTED')}
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
                          onClick={() => handleCancel(deal.id)}
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
                            onClick={() => handleComplete(deal.id, 'CANCELLED')}
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
