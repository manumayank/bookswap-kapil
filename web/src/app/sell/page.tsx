"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const CATEGORIES = ['Textbooks', 'Stationery'] as const;
const CONDITIONS = [
  { label: 'Hardly Used', value: 'HARDLY_USED' },
  { label: 'Well Maintained', value: 'WELL_MAINTAINED' },
  { label: 'Marker Used', value: 'MARKER_USED' },
  { label: 'Stains', value: 'STAINS' },
  { label: 'Torn Pages', value: 'TORN_PAGES' },
] as const;

export default function SellPage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated) return;

    setIsSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      condition: formData.get('condition') as string,
      board: formData.get('board') as string,
      class: Number(formData.get('class')),
      subject: formData.get('subject') as string,
      city: formData.get('city') as string,
      buyingPrice: Number(formData.get('buyingPrice')) || 0,
      sellingPrice: Number(formData.get('sellingPrice')) || 0,
    };

    try {
      const { data } = await api.post('/listings', payload);
      if (data.success) {
        setStatus({ type: 'success', message: 'Listing submitted for review!' });
        form.reset();
      } else {
        setStatus({ type: 'error', message: data.error || 'Something went wrong.' });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to connect to server.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-background min-h-screen py-24">
        <div className="container max-w-3xl text-center animate-fade-in">
          <h1 className="text-4xl font-black mb-6 tracking-tight">Please log in</h1>
          <p className="text-muted font-medium text-lg mb-10">
            You need to be logged in to list an item for sale.
          </p>
          <Link href="/login" className="btn btn-primary text-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-24">
      <div className="container max-w-3xl">
        <header className="mb-20 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="opacity-30">/</span>
            <span>Post Listing</span>
          </div>
          <h1 className="text-6xl font-black mb-6 tracking-tight">List your item</h1>
          <p className="text-muted font-medium text-lg max-w-md mx-auto leading-relaxed">
            Join our community of parents saving on school essentials.
          </p>
        </header>

        <form className="flex flex-col gap-12" onSubmit={handleSubmit}>
          {status && (
            <div
              className={`p-6 rounded-3xl font-bold text-center animate-slide-down ${
                status.type === 'success'
                  ? 'bg-secondary/10 text-secondary border border-secondary/20'
                  : 'bg-accent/10 text-accent border border-accent/20'
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Step 1: Photos & Media */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                01
              </span>
              <h2 className="text-2xl font-black tracking-tight">Photos & Media</h2>
            </div>

            <div className="card-premium p-10 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="aspect-square rounded-[24px] border-2 border-dashed border-card-border flex flex-col items-center justify-center p-6 group hover:border-primary hover:bg-primary/5 cursor-pointer transition-all">
                  <input type="file" className="hidden" accept="image/*" multiple />
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {/* camera icon placeholder */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-light group-hover:text-primary"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-light group-hover:text-primary text-center">
                    Add Main Photo
                  </span>
                </label>
                {[1, 2, 3].map((i) => (
                  <label
                    key={i}
                    className="aspect-square rounded-[24px] border-2 border-dashed border-card-border/40 flex items-center justify-center hover:border-primary transition-all cursor-pointer group"
                  >
                    <input type="file" className="hidden" accept="image/*" />
                    <span className="text-xl opacity-20 group-hover:opacity-100 group-hover:text-primary group-hover:scale-125 transition-all">
                      +
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-muted-extra-light/50 border border-card-border flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p className="text-[11px] text-muted font-medium leading-relaxed">
                  <span className="font-bold text-foreground">Pro tip:</span> Take photos in natural light. Items with 3+ photos sell{' '}
                  <span className="text-secondary font-bold">2x faster</span>.
                </p>
              </div>
            </div>
          </section>

          {/* Step 2: Item Details */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                02
              </span>
              <h2 className="text-2xl font-black tracking-tight">Item Details</h2>
            </div>

            <div className="card-premium p-10 bg-white flex flex-col gap-10">
              {/* Title */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  What are you selling?
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. NCERT Mathematics Class X - 2024 Edition"
                  className="w-full text-base font-bold py-5 px-6 rounded-2xl"
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Condition
                  </label>
                  <select
                    name="condition"
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond.value} value={cond.value}>{cond.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Board & Class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Board
                  </label>
                  <select
                    name="board"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    <option value="">Select board</option>
                    {BOARDS.map((board) => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Class
                  </label>
                  <select
                    name="class"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    <option value="">Select class</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Subject
                  </label>
                  <input
                    name="subject"
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={5}
                  required
                  placeholder="Tell buyers about the condition, any missing pages, highlights, or notes..."
                  className="w-full font-medium py-5 px-6 rounded-2xl resize-none"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Step 3: Pricing */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
                03
              </span>
              <h2 className="text-2xl font-black tracking-tight">Pricing</h2>
            </div>

            <div className="card-premium p-10 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="transition-transform focus-within:scale-105 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Original Price (MRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-light">
                      &#8377;
                    </span>
                    <input
                      name="buyingPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full pl-12 pr-6 py-6 text-3xl font-black rounded-2xl"
                    />
                  </div>
                </div>
                <div className="transition-transform focus-within:scale-105 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Your Selling Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-light">
                      &#8377;
                    </span>
                    <input
                      name="sellingPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full pl-12 pr-6 py-6 text-3xl font-black rounded-2xl"
                    />
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Free items get matched faster!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-6 pt-10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary h-20 text-xl font-black shadow-2xl rounded-[28px] group disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit My Listing'}
              {!isSubmitting && (
                <span className="group-hover:translate-x-2 transition-transform inline-block ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              )}
            </button>
            <p className="text-center text-[11px] text-muted-light font-medium max-w-xs mx-auto">
              By clicking Submit, you agree to our{' '}
              <span className="font-black text-foreground underline underline-offset-4 cursor-pointer">
                Community Guidelines
              </span>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
