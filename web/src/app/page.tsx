'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import BookCard from '@/components/BookCard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ApiListing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  images?: { imageUrl: string }[];
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: listings,
    isLoading,
    isError,
    refetch,
  } = useQuery<ApiListing[]>({
    queryKey: ['listings', 'recent'],
    queryFn: async () => {
      const res = await api.get('/listings', {
        params: { limit: 8, sortBy: 'newest' },
      });
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    },
    retry: false,
    staleTime: 60_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/browse?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="flex flex-col gap-32 pb-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-48">
        <div className="container relative z-10 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] mb-10">
              The Smartest Way to Buy & Sell School Books
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-10 tracking-tight leading-[0.9]">
              Education made <br />
              <span className="text-primary italic">affordable.</span>
            </h1>
            <p className="text-xl text-muted mb-16 leading-relaxed max-w-2xl mx-auto font-medium">
              Join thousands of parents and students in your neighborhood to buy and sell textbooks, stationery, and more. Save money, save trees.
            </p>

            {/* Search Bar — single primary CTA for buyers */}
            <form onSubmit={handleSearch} className="card-premium p-3 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto shadow-2xl bg-card/50 backdrop-blur-xl">
              <div className="flex-1 flex items-center px-6 gap-4 bg-muted-extra-light rounded-2xl transition-all focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-xl opacity-40" aria-hidden>&#128269;</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, board, or school..."
                  aria-label="Search books"
                  className="w-full py-5 bg-transparent border-none outline-none font-bold placeholder:text-muted-light text-base p-0"
                />
              </div>
              <button type="submit" className="btn btn-primary h-14 md:h-16 px-12 text-lg font-black shadow-2xl">
                Find Books
              </button>
            </form>

            {/* Trending Tags */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs">
              <span className="text-muted-light font-black uppercase tracking-widest">Trending:</span>
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                {['CBSE', 'ICSE', 'NCERT', 'Stationery'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    type="button"
                    className="min-h-10 px-3 rounded-lg hover:text-primary cursor-pointer transition-colors font-extrabold uppercase tracking-widest underline decoration-primary/30 underline-offset-4 bg-transparent border-none text-foreground text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] glow-primary opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 blur-[130px] rounded-full"></div>
      </section>

      {/* Stats / Social Proof */}
      <section className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 text-center border-y border-card-border py-12 md:py-20">
          <div>
            <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">8k+</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted-light">Books Listed</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">&#8377;35L+</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted-light">Saved by Parents</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">5k+</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted-light">Successful Swaps</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">4.8/5</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted-light">Parent Trust Score</p>
          </div>
        </div>
      </section>

      {/* Recently Added Listings */}
      <section className="container">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 block">Marketplace</span>
            <h2 className="text-4xl font-black tracking-tight">Recently Added</h2>
          </div>
          <Link href="/browse" className="btn btn-outline h-12 text-xs font-black uppercase tracking-widest">
            Browse All Books <span>&#8594;</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid-marketplace" aria-busy="true" aria-label="Loading listings">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-flat overflow-hidden">
                <div className="aspect-[4/5] skeleton rounded-none" />
                <div className="p-6 space-y-3">
                  <div className="h-4 skeleton" />
                  <div className="h-4 skeleton w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card-flat p-10 text-center">
            <p className="font-bold mb-2">Couldn&apos;t load recent listings.</p>
            <p className="text-sm text-muted mb-6">Check your connection and try again.</p>
            <button type="button" onClick={() => refetch()} className="btn btn-outline h-11">
              Try again
            </button>
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="card-flat p-10 md:p-16 text-center">
            <div className="text-5xl mb-4" aria-hidden>&#128218;</div>
            <h3 className="text-2xl font-black mb-3">No books listed yet</h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Be the first parent in your area to list a textbook or stationery set.
            </p>
            <Link href="/sell" className="btn btn-primary">
              List a Book
            </Link>
          </div>
        ) : (
          <div className="grid-marketplace">
            {listings.slice(0, 8).map((listing) => (
              <BookCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                sellingPrice={listing.sellingPrice}
                buyingPrice={listing.buyingPrice}
                condition={listing.condition}
                category={listing.category}
                city={listing.city}
                imageUrl={listing.images?.[0]?.imageUrl}
              />
            ))}
          </div>
        )}
      </section>

      {/* Category Shortcuts */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              emoji: '\uD83D\uDCDA',
              title: 'Textbooks',
              desc: 'CBSE, ICSE, IB & State Boards',
              color: 'primary',
              href: '/browse?category=BOOK',
            },
            {
              emoji: '\u270F\uFE0F',
              title: 'Stationery',
              desc: 'Kits, Geometry Boxes, Art Supplies',
              color: 'secondary',
              href: '/browse?category=STATIONERY',
            },
          ].map((cat, i) => (
            <Link
              key={i}
              href={cat.href}
              className="card-premium card-interactive p-8 md:p-10 group cursor-pointer border-transparent shadow-none bg-muted-extra-light/50 hover:bg-card block"
            >
              <div
                className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center text-3xl shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                  cat.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                }`}
              >
                {cat.emoji}
              </div>
              <h3 className="text-xl font-black mb-2">{cat.title}</h3>
              <p className="text-sm text-muted font-medium mb-6">{cat.desc}</p>
              <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 transition-all md:translate-x-[-10px] md:group-hover:translate-x-0">
                <span className="text-xs font-black uppercase tracking-widest text-primary">Explore Category</span>
                <span className="text-primary text-lg">&#8594;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* For Sellers — segmented seller entry point */}
      <section className="container">
        <div className="relative rounded-[40px] md:rounded-[60px] bg-surface-inverse p-8 sm:p-16 md:p-32 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary-light mb-6 block">For Sellers</span>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-none">
              Turn your{' '}
              <span className="text-primary-light">old books</span> into cash.
            </h2>
            <p className="text-white/70 text-lg md:text-xl mb-14 leading-relaxed font-medium">
              List your items in seconds. Help another student succeed and earn from books you no longer need.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/sell"
                className="btn btn-primary h-16 md:h-20 px-10 md:px-16 text-lg md:text-xl font-black rounded-3xl"
              >
                List a Book
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[60%] h-full bg-primary/20 -skew-x-12 translate-x-1/4"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-secondary blur-[100px] opacity-20"></div>

          <div className="absolute bottom-10 right-10 hidden lg:block opacity-20 rotate-12">
            <span className="text-[200px]">&#128218;</span>
          </div>
        </div>
      </section>
    </div>
  );
}
