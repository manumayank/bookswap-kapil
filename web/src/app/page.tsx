'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import BookCard from '@/components/BookCard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'Mathematics Class 10 - NCERT',
    sellingPrice: 150,
    buyingPrice: 350,
    condition: 'Like New',
    category: 'Textbook',
    city: 'Mumbai',
  },
  {
    id: '2',
    title: 'Evergreen Science Lab Manual Class 9',
    sellingPrice: 200,
    buyingPrice: 400,
    condition: 'Good',
    category: 'Textbook',
    city: 'Delhi',
  },
  {
    id: '3',
    title: 'Oxford English Dictionary',
    sellingPrice: 450,
    buyingPrice: 850,
    condition: 'New',
    category: 'Textbook',
    city: 'Bangalore',
  },
  {
    id: '4',
    title: 'RD Sharma Class 11 Vol 1 & 2',
    sellingPrice: 600,
    buyingPrice: 1100,
    condition: 'Good',
    category: 'Textbook',
    city: 'Pune',
  },
  {
    id: '5',
    title: 'Complete Stationery Kit - Class 8',
    sellingPrice: 320,
    buyingPrice: 650,
    condition: 'New',
    category: 'Stationery',
    city: 'Chennai',
  },
  {
    id: '6',
    title: 'HC Verma Concepts of Physics Vol 1',
    sellingPrice: 280,
    buyingPrice: 550,
    condition: 'Like New',
    category: 'Textbook',
    city: 'Hyderabad',
  },
  {
    id: '7',
    title: 'Lakhmir Singh Biology Class 10',
    sellingPrice: 180,
    buyingPrice: 380,
    condition: 'Good',
    category: 'Textbook',
    city: 'Kolkata',
  },
  {
    id: '8',
    title: 'Geometry Box + Art Supplies Set',
    sellingPrice: 250,
    buyingPrice: 500,
    condition: 'Like New',
    category: 'Stationery',
    city: 'Jaipur',
  },
];

interface ApiListing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  imageUrl?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: listings } = useQuery<ApiListing[]>({
    queryKey: ['listings', 'recent'],
    queryFn: async () => {
      const res = await api.get('/listings', {
        params: { limit: 8, sort: 'createdAt:desc' },
      });
      return res.data?.data || res.data;
    },
    retry: false,
    staleTime: 60_000,
  });

  const displayListings = listings && listings.length > 0 ? listings : MOCK_LISTINGS;

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10">
              The Smartest Way to Buy & Sell School Books
            </div>
            <h1 className="text-7xl md:text-8xl font-black mb-10 tracking-tight leading-[0.9]">
              Education made <br />
              <span className="text-primary italic">affordable.</span>
            </h1>
            <p className="text-xl text-muted mb-16 leading-relaxed max-w-2xl mx-auto font-medium">
              Join thousands of parents and students in your neighborhood to buy and sell textbooks, stationery, and more. Save money, save trees.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/need"
                className="btn btn-primary h-16 px-10 text-base font-black shadow-2xl"
              >
                <span className="mr-2">&#128218;</span> I Need Books
              </Link>
              <Link
                href="/sell"
                className="btn btn-outline h-16 px-10 text-base font-black"
              >
                <span className="mr-2">&#128200;</span> I Have Books to Sell
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="card-premium p-3 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto shadow-2xl bg-white/50 backdrop-blur-xl">
              <div className="flex-1 flex items-center px-6 gap-4 bg-muted-extra-light rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-xl opacity-40">&#128269;</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, board, or school..."
                  className="w-full py-5 bg-transparent border-none outline-none font-bold placeholder:text-muted-light text-base p-0"
                />
              </div>
              <button type="submit" className="btn btn-primary h-16 px-12 text-lg font-black shadow-2xl">
                Find Books
              </button>
            </form>

            {/* Trending Tags */}
            <div className="mt-12 flex items-center justify-center gap-8 text-[11px]">
              <span className="text-muted-light font-black uppercase tracking-widest">Trending:</span>
              <div className="flex gap-4">
                {['CBSE', 'ICSE', 'NCERT', 'Stationery'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="hover:text-primary cursor-pointer transition-colors font-extrabold uppercase tracking-widest underline decoration-primary/30 underline-offset-4 bg-transparent border-none text-foreground text-[11px]"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center border-y border-card-border py-20">
          <div>
            <p className="text-5xl font-black mb-2 tracking-tighter">8k+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-light">Books Listed</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2 tracking-tighter">&#8377;35L+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-light">Saved by Parents</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2 tracking-tighter">5k+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-light">Successful Swaps</p>
          </div>
          <div>
            <p className="text-5xl font-black mb-2 tracking-tighter">4.8/5</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-light">Parent Trust Score</p>
          </div>
        </div>
      </section>

      {/* Recently Added Listings */}
      <section className="container">
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 block">Marketplace</span>
            <h2 className="text-4xl font-black tracking-tight">Recently Added</h2>
          </div>
          <Link href="/browse" className="btn btn-outline h-12 text-[10px] font-black uppercase tracking-widest">
            Browse All Books <span>&#8594;</span>
          </Link>
        </div>

        <div className="grid-marketplace">
          {displayListings.slice(0, 8).map((listing) => (
            <BookCard key={listing.id} {...listing} />
          ))}
        </div>
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
              href: '/browse?category=Textbook',
            },
            {
              emoji: '\u270F\uFE0F',
              title: 'Stationery',
              desc: 'Kits, Geometry Boxes, Art Supplies',
              color: 'secondary',
              href: '/browse?category=Stationery',
            },
          ].map((cat, i) => (
            <Link
              key={i}
              href={cat.href}
              className="card-premium p-10 group cursor-pointer border-none shadow-none bg-muted-extra-light/50 hover:bg-white block"
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
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 group-hover:transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Explore Category</span>
                <span className="text-primary text-lg">&#8594;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="container">
        <div className="relative rounded-[60px] bg-foreground p-16 md:p-32 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-none">
              Turn your{' '}
              <span className="text-primary">old books</span> into cash.
            </h2>
            <p className="text-white/60 text-xl mb-14 leading-relaxed font-medium">
              List your items in seconds. Help another student succeed and earn from books you no longer need.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/sell"
                className="btn btn-primary h-20 px-16 text-xl font-black rounded-3xl"
              >
                Start Selling Now
              </Link>
              <Link
                href="/browse"
                className="btn btn-outline text-white border-white/20 h-20 px-16 text-xl font-black rounded-3xl hover:bg-white/10"
              >
                Browse Books
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
