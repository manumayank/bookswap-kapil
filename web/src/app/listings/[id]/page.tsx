'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { boardLabel, categoryLabel, conditionLabel } from '@/lib/labels';

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
  description?: string;
  status: string;
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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();

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
      const message = err.response?.data?.error || 'Could not send your interest. Please try again.';
      setDealError(message);
    } finally {
      setCreatingDeal(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 animate-pulse">
          <div className="flex-1">
            <div className="aspect-[4/3] rounded-[32px] md:rounded-[48px] bg-muted-extra-light" />
          </div>
          <div className="w-full lg:w-[500px]">
            <div className="h-8 w-32 bg-muted-extra-light rounded-md mb-6" />
            <div className="h-16 w-full bg-muted-extra-light rounded-md mb-8" />
            <div className="h-12 w-48 bg-muted-extra-light rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-black mb-4">Listing Not Found</h1>
        <p className="text-muted-light mb-8">{error || 'This listing may have been removed or doesn&apos;t exist.'}</p>
        <Link href="/browse" className="btn btn-primary">
          Browse Listings
        </Link>
      </div>
    );
  }

  const isSold = listing.status === 'SOLD' || listing.status === 'CANCELLED';
  const savingsPercent = listing.buyingPrice 
    ? Math.round(((listing.buyingPrice - listing.sellingPrice) / listing.buyingPrice) * 100)
    : 0;

  return (
    <div className="container py-12 md:py-20">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
        {/* Left: Image Gallery */}
        <div className="flex-1 animate-fade-in">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 min-h-10 text-xs font-black uppercase tracking-[0.2em] text-muted-light hover:text-primary transition-colors mb-8"
          >
            ← Back to Marketplace
          </Link>

          <div className="aspect-[4/3] rounded-[32px] md:rounded-[48px] bg-muted-extra-light border border-card-border overflow-hidden relative shadow-2xl">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={`${listing.images[selectedImage]?.imageUrl || listing.images[0]?.imageUrl}`}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-20 bg-primary/5">
                <span className="text-7xl md:text-[120px] mb-4 md:mb-8" aria-hidden>📚</span>
                <p className="text-muted-light font-black uppercase tracking-widest text-xs">
                  Photo Coming Soon
                </p>
              </div>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-4xl font-black border-4 border-white px-8 py-4 rotate-[-15deg]">
                  SOLD
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-wrap gap-2 md:gap-3">
              <span className="badge badge-primary glass backdrop-blur-md px-4 py-2 md:px-6 md:py-3">
                {conditionLabel(listing.condition)}
              </span>
              {listing.board && (
                <span className="badge text-foreground glass backdrop-blur-md px-4 py-2 md:px-6 md:py-3">
                  {boardLabel(listing.board)}
                </span>
              )}
            </div>
          </div>

          {listing.images && listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Show photo ${i + 1} of ${listing.images.length}`}
                  aria-pressed={selectedImage === i}
                  className={`aspect-square rounded-2xl md:rounded-3xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                    selectedImage === i ? 'border-primary' : 'border-card-border'
                  }`}
                >
                  <img src={`${img.imageUrl}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Actions */}
        <div className="w-full lg:w-[500px] flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Subject & Class Tags */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {listing.subject && (
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-md">
                  {listing.subject}
                </span>
              )}
              {listing.class && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-light" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-light">
                    Class {listing.class}
                  </span>
                </>
              )}
              {listing.category && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-light" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-light">
                    {categoryLabel(listing.category)}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter leading-none">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-6">
              <span className="text-4xl md:text-5xl font-black tracking-tighter">
                ₹{listing.sellingPrice}
              </span>
              {!!listing.buyingPrice && listing.buyingPrice > listing.sellingPrice && (
                <div className="flex flex-col">
                  <span className="text-muted-light line-through font-bold text-sm tracking-tighter">
                    ₹{listing.buyingPrice} MRP
                  </span>
                  <span className="text-secondary font-black text-xs uppercase tracking-widest">
                    {savingsPercent}% Savings
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description & Detail Grid */}
          <div className="card-flat p-6 md:p-10 mb-12">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-light mb-6">
              Description
            </h3>
            <p className="text-muted font-medium leading-relaxed text-base mb-10">
              {listing.description || 'No description provided.'}
            </p>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4 pt-10 border-t border-card-border">
              {listing.board && (
                <div>
                  <span className="block text-muted-light font-black uppercase tracking-widest text-xs mb-2">
                    Academic Board
                  </span>
                  <span className="font-bold text-sm">{boardLabel(listing.board)}</span>
                </div>
              )}
              {listing.class && (
                <div>
                  <span className="block text-muted-light font-black uppercase tracking-widest text-xs mb-2">
                    Class Level
                  </span>
                  <span className="font-bold text-sm">Class {listing.class}</span>
                </div>
              )}
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-xs mb-2">
                  Condition
                </span>
                <span className="font-bold text-sm">{conditionLabel(listing.condition)}</span>
              </div>
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-xs mb-2">
                  Location
                </span>
                <span className="font-bold text-sm">{listing.city}</span>
              </div>
              {listing.school && (
                <div className="col-span-2">
                  <span className="block text-muted-light font-black uppercase tracking-widest text-xs mb-2">
                    School
                  </span>
                  <span className="font-bold text-sm">{listing.school.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Card — Identity hidden until deal accepted */}
          <div className="card-flat p-6 md:p-8 bg-muted-extra-light/50 border-transparent mb-12">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-[22px] bg-primary text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20">
                {listing.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-xl tracking-tight">
                  Seller in {listing.user.city}
                </h4>
                <p className="text-muted-light text-xs font-bold uppercase tracking-tighter">
                  Posted by {listing.user.name.split(' ')[0]}
                </p>
              </div>
            </div>

            <div className="mt-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted font-medium leading-relaxed">
                🔒 Seller&apos;s full name, phone, and address are revealed only after you both agree to the deal.
              </p>
            </div>
          </div>

          {/* Deal Error Message */}
          {dealError && (
            <div role="alert" className="mb-4 p-4 rounded-xl bg-accent/10 text-accent font-medium">
              {dealError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sticky bottom-8 p-1 glass backdrop-blur-xl rounded-[32px] shadow-2xl">
            {dealCreated ? (
              <div role="status" className="min-h-16 md:min-h-20 px-4 text-center flex items-center justify-center text-lg md:text-xl font-black text-secondary rounded-3xl bg-secondary/10">
                ✓ Interest Expressed! Check Dashboard
              </div>
            ) : isSold ? (
              <div className="min-h-16 md:min-h-20 px-4 text-center flex items-center justify-center text-lg md:text-xl font-black text-muted rounded-3xl bg-muted-extra-light">
                This item is no longer available
              </div>
            ) : (
              <button
                onClick={handleCreateDeal}
                disabled={creatingDeal}
                className="btn btn-primary h-16 md:h-20 text-lg md:text-xl font-black rounded-3xl w-full shadow-2xl group"
              >
                {creatingDeal ? (
                  'Processing...'
                ) : !isAuthenticated ? (
                  <>
                    Login to Express Interest
                    <span className="group-hover:translate-x-1 transition-transform ml-2">→</span>
                  </>
                ) : (
                  <>
                    I&apos;m Interested
                    <span className="group-hover:translate-x-1 transition-transform ml-2">🛒</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="mt-20 md:mt-32 p-8 md:p-12 rounded-[32px] md:rounded-[48px] bg-surface-inverse text-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-white font-black text-2xl mb-4 tracking-tight">
            Stay Safe with Sybrary
          </h3>
          <p className="text-white/70 text-base font-medium max-w-2xl mx-auto leading-relaxed">
            We recommend meeting in public, well-lit areas for exchanges. Never share your OTP or
            bank details before verifying the item in person. Seller details are only shared after
            both parties accept the deal.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" aria-hidden>
          <span className="text-[300px] absolute -bottom-20 -right-20 rotate-12">🛡️</span>
        </div>
      </div>
    </div>
  );
}
