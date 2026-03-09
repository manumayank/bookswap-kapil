'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface Listing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice: number;
  condition: string;
  board: string;
  classLevel: string;
  subject: string;
  category: string;
  city: string;
  description: string;
  sellerFirstInitial: string;
  sellerCity: string;
  sellerJoined: string;
  images: string[];
}

// TODO: Replace with real API call — GET /api/listings/:id
async function fetchListing(id: string): Promise<Listing> {
  // Mock data for now
  return {
    id,
    title: 'Mathematics Class 10th - NCERT',
    sellingPrice: 150,
    buyingPrice: 350,
    condition: 'Like New',
    board: 'CBSE',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    category: 'Textbook',
    city: 'New Delhi',
    description:
      'Fresh condition NCERT textbook for Class 10. Only used for one semester. No highlights or markings. Includes all chapters from Number Systems to Statistics. Perfect for upcoming board exams.',
    sellerFirstInitial: 'A',
    sellerCity: 'New Delhi',
    sellerJoined: 'March 2024',
    images: [],
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    fetchListing(id)
      .then((data) => {
        setListing(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [params?.id]);

  async function handleRequestToBuy() {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!listing) return;

    setRequesting(true);
    try {
      // TODO: Wire up to real API once backend is ready
      await api.post('/matches', {
        listingId: listing.id,
        offeredPrice: offerPrice ? Number(offerPrice) : undefined,
      });
      setRequested(true);
    } catch (error) {
      // For now, simulate success with mock
      console.error('API not available, simulating request:', error);
      setRequested(true);
    } finally {
      setRequesting(false);
    }
  }

  function handleSaveListing() {
    // TODO: Implement save/bookmark functionality
    setSaved(!saved);
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex flex-col lg:flex-row gap-20 animate-pulse">
          <div className="flex-1">
            <div className="aspect-[4/3] rounded-[48px] bg-muted-extra-light" />
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-3xl bg-muted-extra-light" />
              ))}
            </div>
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

  if (!listing) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-black mb-4">Listing Not Found</h1>
        <p className="text-muted-light mb-8">This listing may have been removed or doesn&apos;t exist.</p>
        <Link href="/browse" className="btn btn-primary">
          Browse Listings
        </Link>
      </div>
    );
  }

  const savingsPercent = Math.round(
    ((listing.buyingPrice - listing.sellingPrice) / listing.buyingPrice) * 100
  );

  return (
    <div className="container py-20">
      <div className="flex flex-col lg:flex-row gap-20">
        {/* Left: Image Gallery */}
        <div className="flex-1 animate-fade-in">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-light hover:text-primary transition-colors mb-10"
          >
            &larr; Back to Marketplace
          </Link>

          <div className="aspect-[4/3] rounded-[48px] bg-muted-extra-light border border-card-border overflow-hidden relative shadow-2xl group">
            <div className="w-full h-full flex flex-col items-center justify-center p-20 bg-primary/5">
              <span className="text-[120px] mb-8 group-hover:scale-110 transition-transform duration-700">
                {listing.images.length > 0 ? '' : '\uD83D\uDCDA'}
              </span>
              <p className="text-muted-light font-black uppercase tracking-widest text-xs">
                {listing.images.length > 0 ? '' : 'Photo Coming Soon'}
              </p>
            </div>
            <div className="absolute top-8 left-8 flex gap-3">
              <span className="badge badge-primary glass backdrop-blur-md px-6 py-3">
                {listing.condition}
              </span>
              <span className="badge bg-white/80 text-foreground glass backdrop-blur-md px-6 py-3">
                {listing.board}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`aspect-square rounded-3xl bg-muted-extra-light border flex items-center justify-center text-3xl cursor-pointer transition-all hover:scale-105 ${
                  selectedImage === i
                    ? 'border-primary opacity-100'
                    : 'border-card-border opacity-40 hover:opacity-100'
                }`}
              >
                {'\uD83D\uDCD6'}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details & Actions */}
        <div className="w-full lg:w-[500px] flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Subject & Class Tags */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-md">
                {listing.subject}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-light" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light">
                {listing.classLevel}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-none">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-6">
              <span className="text-5xl font-black tracking-tighter">
                &#8377;{listing.sellingPrice}
              </span>
              <div className="flex flex-col">
                <span className="text-muted-light line-through font-bold text-sm tracking-tighter">
                  &#8377;{listing.buyingPrice} MRP
                </span>
                <span className="text-secondary font-black text-[10px] uppercase tracking-widest">
                  {savingsPercent}% Savings
                </span>
              </div>
            </div>
          </div>

          {/* Description & Detail Grid */}
          <div className="card-premium p-10 mb-12 bg-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light mb-6">
              Description
            </h3>
            <p className="text-muted font-medium leading-relaxed text-base mb-10">
              {listing.description}
            </p>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4 pt-10 border-t border-card-border">
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-[9px] mb-2">
                  Academic Board
                </span>
                <span className="font-bold text-sm">{listing.board}</span>
              </div>
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-[9px] mb-2">
                  Class Level
                </span>
                <span className="font-bold text-sm">{listing.classLevel}</span>
              </div>
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-[9px] mb-2">
                  Condition
                </span>
                <span className="font-bold text-sm">{listing.condition}</span>
              </div>
              <div>
                <span className="block text-muted-light font-black uppercase tracking-widest text-[9px] mb-2">
                  Category
                </span>
                <span className="font-bold text-sm">{listing.category}</span>
              </div>
            </div>
          </div>

          {/* Seller Card — Identity hidden until deal accepted */}
          <div className="card-premium p-8 bg-muted-extra-light/50 border-none mb-12">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 rounded-[22px] bg-primary text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20">
                {listing.sellerFirstInitial}
              </div>
              <div>
                <h4 className="font-black text-xl tracking-tight">
                  Seller in {listing.sellerCity}
                </h4>
                <p className="text-muted-light text-xs font-bold uppercase tracking-tighter">
                  Member since {listing.sellerJoined}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm font-bold text-muted">
              <span className="opacity-40">{'\uD83D\uDCCD'}</span> {listing.city}
            </div>

            <div className="mt-4 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted font-medium leading-relaxed">
                {'\uD83D\uDD12'} Seller&apos;s full name, phone, and address are revealed only after the deal is accepted by both parties.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sticky bottom-8 p-1 glass backdrop-blur-xl rounded-[32px] border border-white/20 shadow-2xl">
            {requested ? (
              <div className="h-20 flex items-center justify-center text-xl font-black text-secondary rounded-3xl bg-secondary/10">
                {'\u2713'} Request Sent Successfully
              </div>
            ) : (
              <button
                onClick={handleRequestToBuy}
                disabled={requesting}
                className="btn btn-primary h-20 text-xl font-black rounded-3xl w-full shadow-2xl group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {requesting ? (
                  'Sending Request...'
                ) : !isAuthenticated ? (
                  <>
                    Login to Request
                    <span className="group-hover:translate-x-1 transition-transform">{'\u2192'}</span>
                  </>
                ) : (
                  <>
                    Request to Buy
                    <span className="group-hover:translate-x-1 transition-transform">{'\uD83D\uDED2'}</span>
                  </>
                )}
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleSaveListing}
                className={`btn h-14 font-black rounded-2xl text-[11px] uppercase tracking-widest ${
                  saved
                    ? 'bg-primary/10 border-primary text-primary border'
                    : 'btn-outline'
                }`}
              >
                {saved ? '\u2665 Saved' : 'Save Listing'}
              </button>
              <button
                onClick={() => setShowOfferInput(!showOfferInput)}
                className="btn btn-outline h-14 font-black rounded-2xl text-[11px] uppercase tracking-widest border-secondary text-secondary hover:bg-secondary/5"
              >
                {showOfferInput ? 'Cancel' : 'Offer Price'}
              </button>
            </div>

            {showOfferInput && (
              <div className="flex items-center gap-3 px-4 pb-3 animate-fade-in">
                <span className="text-lg font-black text-muted-light">&#8377;</span>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder={`Suggest a price (listed at ₹${listing.sellingPrice})`}
                  className="flex-1 h-12 rounded-xl text-sm font-bold"
                  min={1}
                />
                <button
                  onClick={handleRequestToBuy}
                  disabled={!offerPrice || requesting}
                  className="btn btn-secondary h-12 px-6 rounded-xl text-sm font-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="mt-32 p-12 rounded-[48px] bg-foreground text-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-white font-black text-2xl mb-4 tracking-tight">
            Stay Safe with BookSwap
          </h3>
          <p className="text-white/50 text-base font-medium max-w-2xl mx-auto leading-relaxed">
            We recommend meeting in public, well-lit areas for exchanges. Never share your OTP or
            bank details before verifying the item in person. Seller details are only shared after
            both parties accept the deal.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <span className="text-[300px] absolute -bottom-20 -right-20 rotate-12">{'\uD83D\uDEE1\uFE0F'}</span>
        </div>
      </div>
    </div>
  );
}
