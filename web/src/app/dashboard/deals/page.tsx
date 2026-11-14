'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Phone, Mail, MapPin, RotateCw, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import PageHeader from '@/components/app/PageHeader';
import SectionHeader from '@/components/app/SectionHeader';
import ListingThumb from '@/components/app/ListingThumb';
import EmptyState from '@/components/app/EmptyState';
import InlineAlert from '@/components/app/InlineAlert';
import { rupees, shortDate, statusBadgeClass } from '@/components/app/status';

interface Party {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  city: string;
}

interface Deal {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  agreedPrice: number;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    sellingPrice: number;
    category?: string;
    images: { imageUrl: string }[];
  };
  buyer: Party;
  seller: Party;
}

/** Deal tagged with the signed-in user's side of it. */
type RoleDeal = Deal & { isSeller: boolean };

type ConfirmKind = 'reject' | 'cancelInterest' | 'cancelDeal';

const CONFIRM_TEXT: Record<ConfirmKind, { question: string; yes: string }> = {
  reject: { question: 'Reject this buyer?', yes: 'Yes, reject' },
  cancelInterest: { question: 'Withdraw your request?', yes: 'Yes, withdraw' },
  cancelDeal: { question: 'Cancel this accepted deal?', yes: 'Yes, cancel deal' },
};

const STATUS_TEXT: Record<Deal['status'], string> = {
  PENDING: 'Waiting for reply',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

function byNewest(a: Deal, b: Deal) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function DealsPage() {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const [deals, setDeals] = useState<RoleDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  // Destructive actions (reject / cancel) need a second click to confirm
  const [confirming, setConfirming] = useState<{ id: string; kind: ConfirmKind } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchDeals() {
    setLoading(true);
    setLoadError('');
    try {
      const [buying, selling] = await Promise.all([api.get('/deals/my/buying'), api.get('/deals/my/selling')]);
      const asBuyer: RoleDeal[] = (buying.data.data || []).map((d: Deal) => ({ ...d, isSeller: false }));
      const asSeller: RoleDeal[] = (selling.data.data || []).map((d: Deal) => ({ ...d, isSeller: true }));
      setDeals([...asSeller, ...asBuyer].sort(byNewest));
    } catch (err: any) {
      setDeals([]);
      setLoadError(err?.response?.data?.error || 'Couldn’t load your deals. Check your connection and try again.');
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
    runAction(dealId, () => api.post(`/deals/${dealId}/respond`, { status }), 'Couldn’t update the deal. Please try again.');

  const handleComplete = (dealId: string, status: 'COMPLETED' | 'CANCELLED') =>
    runAction(dealId, () => api.post(`/deals/${dealId}/complete`, { status }), 'Couldn’t update the deal. Please try again.');

  const handleCancel = (dealId: string) =>
    runAction(dealId, () => api.post(`/deals/${dealId}/cancel`), 'Couldn’t withdraw your request. Please try again.');

  function confirmAction(deal: Deal) {
    if (!confirming) return;
    if (confirming.kind === 'reject') handleRespond(deal.id, 'REJECTED');
    else if (confirming.kind === 'cancelInterest') handleCancel(deal.id);
    else handleComplete(deal.id, 'CANCELLED');
  }

  if (!isHydrated) {
    return (
      <div aria-busy="true">
        <div className="skeleton mb-3 h-12 w-48" />
        <div className="skeleton mb-8 h-5 w-72" />
        <div className="skeleton h-40 rounded-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Lock}
        title="Log in to see your deals"
        description="Your deals with other parents are private to your account."
        action={
          <Link href="/login" className="btn btn-primary">
            Log in
          </Link>
        }
      />
    );
  }

  const toYou = deals.filter((d) => d.isSeller && d.status === 'PENDING');
  const yours = deals.filter((d) => !d.isSeller && d.status === 'PENDING');
  const accepted = deals.filter((d) => d.status === 'ACCEPTED');
  const completed = deals.filter((d) => d.status === 'COMPLETED');
  const closed = deals.filter((d) => d.status === 'REJECTED' || d.status === 'CANCELLED');

  const summaryParts: string[] = [];
  if (toYou.length) summaryParts.push(`${toYou.length} waiting for your reply`);
  if (accepted.length) summaryParts.push(`${accepted.length} ready to meet up`);
  const summary = loading
    ? 'Loading your deals.'
    : summaryParts.length
      ? `${summaryParts.join(', ')}.`.replace(/^./, (c) => c.toUpperCase())
      : 'Every deal you buy or sell shows here, grouped by what happens next.';

  function renderDeal(deal: RoleDeal) {
    const otherParty = deal.isSeller ? deal.buyer : deal.seller;
    const showContact = deal.status === 'ACCEPTED' || deal.status === 'COMPLETED';
    const busy = actionLoading === deal.id;
    const isConfirming = confirming?.id === deal.id;

    let nextStep = '';
    if (deal.status === 'PENDING')
      nextStep = deal.isSeller ? 'Accept to share your contact details with this buyer.' : 'Waiting for the seller to reply.';
    else if (deal.status === 'ACCEPTED') nextStep = 'Meet up, hand over the books, then mark the deal complete.';

    return (
      <li key={deal.id} className="p-4 sm:p-5">
        <div className="flex gap-4">
          <Link href={`/listings/${deal.listing.id}`} className="shrink-0 rounded-md" tabIndex={-1} aria-hidden="true">
            <ListingThumb
              id={deal.listing.id}
              imageUrl={deal.listing.images?.[0]?.imageUrl}
              category={deal.listing.category}
              size="lg"
              className="max-sm:h-16 max-sm:w-16"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <Link
                href={`/listings/${deal.listing.id}`}
                className="min-w-0 text-lg font-bold leading-snug hover:underline hover:decoration-primary hover:decoration-2 hover:underline-offset-4"
              >
                {deal.listing.title}
              </Link>
              <span className="text-lg font-extrabold">{rupees(deal.agreedPrice)}</span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`badge ${statusBadgeClass(deal.status)}`}>{STATUS_TEXT[deal.status]}</span>
              <span className="badge badge-muted">{deal.isSeller ? 'You’re selling' : 'You’re buying'}</span>
            </div>

            <p className="mt-2 text-sm text-muted">
              {deal.isSeller ? 'Buyer' : 'Seller'}:{' '}
              <span className="font-semibold text-foreground">
                {showContact ? otherParty.name : `${otherParty.name.charAt(0)}***`}
              </span>
              {!showContact && deal.status === 'PENDING' && ' (name and contact shared once accepted)'}
            </p>
            {deal.createdAt && <p className="text-[13px] text-muted-light">Started {shortDate(deal.createdAt)}</p>}
          </div>
        </div>

        {/* Contact details, revealed after acceptance */}
        {showContact && (otherParty.phone || otherParty.email || otherParty.city) && (
          <div
            className={`mt-4 rounded-md border-2 border-edge p-4 ${
              deal.status === 'ACCEPTED' ? 'bg-sun text-ink shadow-pop-sm' : 'bg-muted-extra-light'
            }`}
          >
            <p className="mb-2 text-sm font-bold">Contact {otherParty.name}</p>
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
              {otherParty.phone && (
                <a
                  href={`tel:${otherParty.phone}`}
                  className="inline-flex min-h-10 items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
                >
                  <Phone size={16} aria-hidden="true" />
                  {otherParty.phone}
                </a>
              )}
              {otherParty.email && (
                <a
                  href={`mailto:${otherParty.email}`}
                  className="inline-flex min-h-10 items-center gap-2 font-semibold underline decoration-2 underline-offset-4"
                >
                  <Mail size={16} aria-hidden="true" />
                  {otherParty.email}
                </a>
              )}
              {otherParty.city && (
                <span className="inline-flex min-h-10 items-center gap-2">
                  <MapPin size={16} aria-hidden="true" />
                  {otherParty.city}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Next action */}
        {(nextStep || isConfirming || deal.status === 'COMPLETED') && (
          <div className="mt-4 flex flex-col gap-3 border-t border-card-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            {isConfirming && confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{CONFIRM_TEXT[confirming.kind].question}</span>
                <button
                  type="button"
                  onClick={() => confirmAction(deal)}
                  disabled={busy}
                  className="btn btn-outline btn-sm text-accent"
                >
                  {busy ? 'Working…' : CONFIRM_TEXT[confirming.kind].yes}
                </button>
                <button type="button" onClick={() => setConfirming(null)} disabled={busy} className="btn btn-ghost btn-sm">
                  Go back
                </button>
              </div>
            ) : (
              <>
                {deal.status === 'COMPLETED' ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-secondary-dark">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Deal completed
                  </p>
                ) : (
                  <p className="text-sm text-muted">{nextStep}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {deal.status === 'PENDING' && deal.isSeller && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespond(deal.id, 'ACCEPTED')}
                        disabled={busy}
                        className="btn btn-secondary btn-sm"
                      >
                        {busy ? 'Accepting…' : 'Accept buyer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming({ id: deal.id, kind: 'reject' })}
                        disabled={busy}
                        className="btn btn-outline btn-sm text-accent"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {deal.status === 'PENDING' && !deal.isSeller && (
                    <button
                      type="button"
                      onClick={() => setConfirming({ id: deal.id, kind: 'cancelInterest' })}
                      disabled={busy}
                      className="btn btn-outline btn-sm"
                    >
                      Withdraw request
                    </button>
                  )}

                  {deal.status === 'ACCEPTED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleComplete(deal.id, 'COMPLETED')}
                        disabled={busy}
                        className="btn btn-primary btn-sm"
                      >
                        {busy ? 'Saving…' : 'Mark complete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming({ id: deal.id, kind: 'cancelDeal' })}
                        disabled={busy}
                        className="btn btn-outline btn-sm text-accent"
                      >
                        Cancel deal
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </li>
    );
  }

  function group(id: string, title: string, list: RoleDeal[], description?: string, raised = false) {
    if (list.length === 0) return null;
    return (
      <section aria-labelledby={id} className="mb-12">
        <SectionHeader id={id} title={title} count={list.length} description={description} />
        <ul className={`${raised ? 'card-premium divide-y-2 divide-edge' : 'card-flat divide-y divide-card-border'} overflow-hidden`}>
          {list.map(renderDeal)}
        </ul>
      </section>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Deals" description={summary} />

      {actionError && <InlineAlert onDismiss={() => setActionError('')}>{actionError}</InlineAlert>}

      {loading ? (
        <div className="card-flat divide-y divide-card-border" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4 p-5">
              <div className="skeleton h-24 w-24" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-1/2" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="card-flat flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="font-semibold text-accent">{loadError}</p>
          <button type="button" onClick={fetchDeals} className="btn btn-outline btn-sm">
            <RotateCw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No deals yet"
          description="Ask to buy a listing, or list your own books. Deals show up here as soon as someone replies."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/browse" className="btn btn-primary">
                Find books
              </Link>
              <Link href="/sell" className="btn btn-outline">
                List your books
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {group('deals-to-you', 'Requests to you', toYou, 'Parents asking to buy your listings.', true)}
          {group('deals-accepted', 'Accepted', accepted, 'Contact details are shared. Arrange the handover.')}
          {group('deals-yours', 'Your requests', yours, 'Listings you asked to buy.')}
          {group('deals-completed', 'Completed', completed)}
          {closed.length > 0 && (
            <details className="group">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted hover:text-foreground">
                <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
                Rejected and cancelled ({closed.length})
              </summary>
              <ul className="card-flat mt-3 divide-y divide-card-border overflow-hidden">{closed.map(renderDeal)}</ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
