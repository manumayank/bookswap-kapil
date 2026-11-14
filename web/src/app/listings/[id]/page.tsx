'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  BookX,
  Check,
  GraduationCap,
  Lock,
  MapPin,
  PencilRuler,
  School,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { boardLabel, categoryLabel, conditionLabel, pickupLabel } from '@/lib/labels';
import { coverTone, formatRupees } from '@/components/listing/format';

interface Listing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  board?: string;
  class?: number;
  subject?: string;
  category: string;
  city: string;
  sector?: string | null;
  pickupLocation?: string | null;
  description?: string;
  status: string;
  createdAt?: string;
  images: { imageUrl: string }[];
  user: {
    id: string;
    name: string;
    city: string;
  };
  school?: {
    name: string;
  };
}

function firstName(name?: string): string {
  return (name || '').trim().split(/\s+/)[0] || 'the seller';
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dealError, setDealError] = useState('');
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [dealCreated, setDealCreated] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    fetchListing(id);
  }, [params?.id]);

  async function fetchListing(id: string) {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/listings/${id}`);
      if (data.success) {
        setListing(data.data);
      } else {
        setError('Listing not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDeal() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!listing) return;

    setCreatingDeal(true);
    setDealError('');
    try {
      const { data } = await api.post('/deals', {
        listingId: listing.id,
      });

      if (data.success) {
        setDealCreated(true);
        // Redirect to deals page after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/deals');
        }, 2000);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Your request did not go through. Please try again.';
      setDealError(message);
    } finally {
      setCreatingDeal(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-8 md:py-12" aria-busy="true" aria-label="Loading listing">
        <div className="skeleton mb-6 h-10 w-36" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <div className="skeleton aspect-[4/3] rounded-lg" />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton aspect-square" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="skeleton h-7 w-20 rounded-full" />
              <div className="skeleton h-7 w-16 rounded-full" />
            </div>
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-2/3" />
            <div className="skeleton h-36 w-full rounded-lg" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container py-16 md:py-24">
        <div className="card-flat mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center">
          <span className="mb-5 flex h-16 w-16 -rotate-3 items-center justify-center rounded-lg border-2 border-edge bg-sun text-ink shadow-pop-sm">
            <BookX className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </span>
          <h1 className="mb-3 text-3xl md:text-4xl">This listing isn&apos;t available</h1>
          <p className="mb-7 text-muted">
            It may have been sold, or the seller removed it. There could be another copy for the same class.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/browse" className="btn btn-primary">
              Browse books
            </Link>
            <Link href="/need" className="btn btn-outline">
              Request this book
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSold = listing.status === 'SOLD' || listing.status === 'CANCELLED';
  const isOwner = !!user && user.id === listing.user.id;
  const hasMrp = !!listing.buyingPrice && listing.buyingPrice > listing.sellingPrice;
  const savings = hasMrp ? listing.buyingPrice! - listing.sellingPrice : 0;
  const savingsPercent = hasMrp ? Math.round((savings / listing.buyingPrice!) * 100) : 0;
  const images = listing.images || [];
  const activeImage = images[selectedImage]?.imageUrl || images[0]?.imageUrl;
  const isStationery = listing.category === 'STATIONERY';
  const Glyph = isStationery ? PencilRuler : BookOpen;
  const seller = firstName(listing.user.name);
  const listedOn = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const pickup = [listing.pickupLocation ? pickupLabel(listing.pickupLocation) : '', listing.sector]
    .filter(Boolean)
    .join(', ');

  const details: { icon: typeof MapPin; label: string; value: string }[] = [
    ...(listing.class ? [{ icon: GraduationCap, label: 'Class', value: `Class ${listing.class}` }] : []),
    ...(listing.board ? [{ icon: BookOpen, label: 'Board', value: boardLabel(listing.board) }] : []),
    ...(listing.school ? [{ icon: School, label: 'School', value: listing.school.name }] : []),
    { icon: Tag, label: 'Condition', value: conditionLabel(listing.condition) },
    { icon: MapPin, label: 'Pickup', value: pickup ? `${pickup}, ${listing.city}` : listing.city },
  ];

  // The one action on the page, rendered in the side column on desktop and
  // in a sticky bar on phones.
  function renderAction(size: 'lg' | 'md') {
    const h = size === 'lg' ? 'btn-lg' : '';
    if (isOwner) {
      return (
        <Link href="/dashboard" className={`btn btn-outline w-full ${h}`}>
          Manage your listing
        </Link>
      );
    }
    if (dealCreated) {
      return (
        <p role="status" className={`btn btn-secondary w-full ${h} pointer-events-none`}>
          <Check className="h-5 w-5" aria-hidden />
          Request sent
        </p>
      );
    }
    if (isSold) {
      return (
        <p className={`btn btn-outline w-full ${h} pointer-events-none text-muted`} aria-disabled="true">
          No longer available
        </p>
      );
    }
    return (
      <button
        type="button"
        onClick={handleCreateDeal}
        disabled={creatingDeal}
        className={`btn btn-primary w-full ${h}`}
      >
        {creatingDeal
          ? 'Sending request…'
          : isAuthenticated
            ? 'Request this book'
            : 'Log in to request this book'}
      </button>
    );
  }

  return (
    <div className="container pb-32 pt-6 md:pt-10 lg:pb-16">
      <Link
        href="/browse"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted decoration-primary decoration-2 underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to browse
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 animate-fade-in">
        {/* Left: gallery + about */}
        <div className="min-w-0">
          <div className="card-premium relative aspect-[4/3] overflow-hidden rounded-lg">
            {activeImage ? (
              <img src={activeImage} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${coverTone(listing.id)}`}>
                <Glyph className="h-24 w-24 text-ink md:h-32 md:w-32" strokeWidth={1.5} aria-hidden />
                <span className="text-sm font-semibold text-ink">No photo yet</span>
              </div>
            )}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-inverse/60">
                <span className="sticker px-5 py-2 text-2xl">
                  {listing.status === 'SOLD' ? 'Sold' : 'No longer available'}
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Show photo ${i + 1} of ${images.length}`}
                  aria-pressed={selectedImage === i}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition-transform duration-150 ${
                    selectedImage === i
                      ? 'border-edge shadow-pop-sm -translate-x-0.5 -translate-y-0.5'
                      : 'border-card-border opacity-80 hover:border-edge hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* About (desktop position; repeated below the action on phones) */}
          <section className="mt-10 hidden lg:block" aria-labelledby="about-heading-desktop">
            <h2 id="about-heading-desktop" className="mb-3 text-2xl">
              About this {isStationery ? 'set' : 'book'}
            </h2>
            <p className="max-w-[68ch] whitespace-pre-line text-muted">
              {listing.description || `${seller} hasn't added a description.`}
            </p>
          </section>
        </div>

        {/* Right: summary, price, action, seller */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex flex-wrap gap-2">
            {listing.class ? <span className="badge badge-primary">Class {listing.class}</span> : null}
            {listing.board ? <span className="badge badge-muted">{boardLabel(listing.board)}</span> : null}
            <span className="badge badge-muted">{categoryLabel(listing.category)}</span>
            {listing.subject ? <span className="badge badge-muted">{listing.subject}</span> : null}
          </div>

          <h1 className="mb-2 text-4xl md:text-5xl">{listing.title}</h1>
          {listedOn && <p className="mb-6 text-sm text-muted">Listed on {listedOn}</p>}

          {/* Price block */}
          <div className="card-flat mb-5 p-5">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="text-5xl font-extrabold leading-none tracking-tight">
                <span className="sr-only">Price </span>
                {formatRupees(listing.sellingPrice)}
              </p>
              {hasMrp && (
                <p className="pb-1 text-muted">
                  <span className="sr-only">Original price </span>
                  <s>{formatRupees(listing.buyingPrice!)}</s> new
                </p>
              )}
              {hasMrp && (
                <span className="badge badge-secondary mb-1 text-sm">
                  Save {formatRupees(savings)} ({savingsPercent}%)
                </span>
              )}
            </div>

            <dl className="mt-5 grid gap-3 border-t-2 border-card-border pt-5 sm:grid-cols-2">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className={`flex items-start gap-3 ${label === 'School' || label === 'Pickup' ? 'sm:col-span-2' : ''}`}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted-extra-light text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {dealError && (
            <div role="alert" className="mb-4 rounded-md border-2 border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
              {dealError}
            </div>
          )}
          {dealCreated && (
            <p role="status" className="mb-4 rounded-md border-2 border-secondary bg-secondary/10 px-4 py-3 text-sm font-semibold text-secondary-dark">
              Request sent to {seller}. Taking you to your deals&hellip;
            </p>
          )}

          <div className="mb-6 hidden lg:block">{renderAction('lg')}</div>

          {/* Locked seller panel */}
          {!isOwner && (
            <div className="card-soft p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-edge bg-sun text-ink">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">
                    Listed by {seller} in {listing.user.city || listing.city}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {seller}&apos;s phone number and pickup address unlock once they accept your request. Until
                    then, neither of you sees the other&apos;s contact details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* About (phone position) */}
          <section className="mt-8 lg:hidden" aria-labelledby="about-heading">
            <h2 id="about-heading" className="mb-3 text-2xl">
              About this {isStationery ? 'set' : 'book'}
            </h2>
            <p className="whitespace-pre-line text-muted">
              {listing.description || `${seller} hasn't added a description.`}
            </p>
          </section>
        </div>
      </div>

      {/* Safety tips */}
      <section className="card-soft mt-12 p-5 md:mt-16 md:p-8" aria-labelledby="safety-heading">
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-edge bg-secondary text-ink">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 id="safety-heading" className="mb-3 text-2xl">
              Meeting the seller
            </h2>
            <ul className="grid gap-3 text-muted md:grid-cols-3 md:gap-6">
              <li>Meet at the school gate or another busy, well-lit place, ideally during the day.</li>
              <li>Check the books page by page before you pay. Look for missing or torn pages.</li>
              <li>Never share an OTP or bank details. Pay only once you have the books in hand.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Phone action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-edge bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="shrink-0">
            <p className="text-2xl font-extrabold leading-none">{formatRupees(listing.sellingPrice)}</p>
            {hasMrp && <p className="mt-1 text-xs font-semibold text-secondary-dark">Save {formatRupees(savings)}</p>}
          </div>
          <div className="min-w-0 flex-1">{renderAction('md')}</div>
        </div>
      </div>
    </div>
  );
}
