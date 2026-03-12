"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const CATEGORIES = ['BOOK', 'STATIONERY'] as const;
const CONDITIONS = [
  { label: 'Hardly Used', value: 'HARDLY_USED' },
  { label: 'Well Maintained', value: 'WELL_MAINTAINED' },
  { label: 'Marker Used', value: 'MARKER_USED' },
  { label: 'Stains', value: 'STAINS' },
  { label: 'Torn Pages', value: 'TORN_PAGES' },
] as const;
const PICKUP_OPTIONS = [
  { label: 'School Gate', value: 'SCHOOL_GATE' },
  { label: 'My Home/Location', value: 'HOME' },
  { label: 'Public Place', value: 'PUBLIC' },
] as const;

interface School {
  id: string;
  name: string;
  city: string;
  board: string;
}

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Search schools
  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchools([]);
      return;
    }
    try {
      const { data } = await api.get(`/schools?name=${query}&limit=10`);
      setSchools(data.data?.schools || []);
    } catch (err) {
      console.error('Failed to search schools:', err);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (schoolSearch && !selectedSchoolName) {
        searchSchools(schoolSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [schoolSearch, selectedSchoolName, searchSchools]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });

    try {
      // Upload to a temporary endpoint first, then attach to listing
      // For now, we'll use FileReader to preview
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newImages.push(reader.result as string);
            setUploadedImages(prev => [...prev, reader.result as string].slice(0, 4));
          }
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated) return;

    // Validate school name is provided
    if (!schoolSearch.trim()) {
      setStatus({ type: 'error', message: 'Please enter a school name' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Build payload - use schoolId if selected from dropdown, otherwise pass schoolName for auto-creation
      const payload: any = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        condition: formData.get('condition') as string,
        board: formData.get('board') as string,
        class: Number(formData.get('class')),
        subject: formData.get('subject') as string,
        city: formData.get('city') as string,
        sector: formData.get('sector') as string,
        pickupLocation: formData.get('pickupLocation') as string,
        buyingPrice: Number(formData.get('buyingPrice')) || 0,
        sellingPrice: Number(formData.get('sellingPrice')) || 0,
      };

      // If school selected from dropdown, use schoolId
      // Otherwise, pass schoolName for auto-creation
      if (selectedSchoolId) {
        payload.schoolId = selectedSchoolId;
      } else if (schoolSearch.trim()) {
        payload.schoolName = schoolSearch.trim();
      }

      const { data } = await api.post('/listings', payload);
      
      if (data.success) {
        setStatus({ type: 'success', message: 'Listing submitted for review!' });
        form.reset();
        setUploadedImages([]);
        setSelectedSchoolId('');
        setSelectedSchoolName('');
        setSchoolSearch('');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
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
              <h2 className="text-2xl font-black tracking-tight">Photos (Required)</h2>
            </div>

            <div className="card-premium p-10 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Main Photo */}
                <label className="aspect-square rounded-[24px] border-2 border-dashed border-primary bg-primary/5 flex flex-col items-center justify-center p-6 group hover:border-primary-dark cursor-pointer transition-all relative overflow-hidden">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  {uploadedImages[0] ? (
                    <img src={uploadedImages[0]} alt="Main" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary text-center">
                        Front Cover *
                      </span>
                    </>
                  )}
                </label>
                
                {/* Additional Photos */}
                {[1, 2, 3].map((i) => (
                  <label
                    key={i}
                    className="aspect-square rounded-[24px] border-2 border-dashed border-card-border/40 flex flex-col items-center justify-center hover:border-primary transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    {uploadedImages[i] ? (
                      <img src={uploadedImages[i]} alt={`Photo ${i}`} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="text-2xl opacity-20 group-hover:opacity-100 group-hover:text-primary group-hover:scale-125 transition-all mb-2">
                          +
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-light">
                          Optional
                        </span>
                      </>
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-muted-extra-light/50 border border-card-border flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p className="text-[11px] text-muted font-medium leading-relaxed">
                  <span className="font-bold text-foreground">Required:</span> At least one front cover photo. 
                  Items with clear photos sell <span className="text-secondary font-bold">3x faster</span>.
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
                  What are you selling? *
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
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat === 'BOOK' ? 'Textbooks' : 'Stationery'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Condition *
                  </label>
                  <select
                    name="condition"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl appearance-none cursor-pointer"
                  >
                    <option value="">Select condition</option>
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
                    Board *
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
                    Class *
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

              {/* Subject */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  Subject *
                </label>
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Science, English..."
                  className="w-full font-bold py-5 px-6 rounded-2xl"
                />
              </div>

              {/* School Search */}
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  School *
                </label>
                <input
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setSelectedSchoolName('');
                    setSelectedSchoolId('');
                    setShowSchoolDropdown(true);
                  }}
                  onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                  placeholder="Type your school name..."
                  className="w-full font-bold py-5 px-6 rounded-2xl"
                />
                {showSchoolDropdown && schools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-card-border rounded-2xl mt-2 max-h-60 overflow-y-auto z-10 shadow-xl">
                    {schools.map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          setSelectedSchoolId(school.id);
                          setSelectedSchoolName(school.name);
                          setSchoolSearch(school.name);
                          setShowSchoolDropdown(false);
                        }}
                        className="w-full text-left px-6 py-4 hover:bg-muted-extra-light border-b border-card-border last:border-0"
                      >
                        <div className="font-bold">{school.name}</div>
                        <div className="text-xs text-muted">{school.city} • {school.board}</div>
                      </button>
                    ))}
                  </div>
                )}
                {showSchoolDropdown && schoolSearch.length >= 2 && schools.length === 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-card-border rounded-2xl mt-2 p-6 z-10 shadow-xl">
                    <div className="text-center">
                      <p className="text-muted mb-4">No schools found matching "{schoolSearch}"</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolName(schoolSearch);
                          setShowSchoolDropdown(false);
                        }}
                        className="btn btn-primary"
                      >
                        + Add "{schoolSearch}" as New School
                      </button>
                      <p className="text-xs text-muted mt-2">This school will be added to our database</p>
                    </div>
                  </div>
                )}
                {selectedSchoolName && (
                  <div className="mt-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center gap-2">
                    <span className="text-secondary">✓</span>
                    <span className="text-sm font-medium">
                      {selectedSchoolId ? 'Selected:' : 'Adding new school:'} {selectedSchoolName}
                    </span>
                  </div>
                )}
              </div>

              {/* City & Sector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    City *
                  </label>
                  <input
                    name="city"
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                    Sector/Colony/Area
                  </label>
                  <input
                    name="sector"
                    type="text"
                    placeholder="e.g. Sector 45, Gurgaon"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  Preferred Pickup Location *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PICKUP_OPTIONS.map((option) => (
                    <label key={option.value} className="cursor-pointer relative">
                      <input
                        type="radio"
                        name="pickupLocation"
                        value={option.value}
                        required
                        className="sr-only peer"
                      />
                      <div className="p-6 rounded-2xl border-2 border-card-border text-center peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all hover:border-primary/50 hover:bg-muted-extra-light/30">
                        <div className="font-bold text-sm peer-checked:font-black">{option.label}</div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-light block mb-4">
                  Description *
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
                    Your Selling Price *
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
                      required
                      className="w-full pl-12 pr-6 py-6 text-3xl font-black rounded-2xl"
                    />
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    Enter 0 for free giveaway!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-6 pt-10">
            <button
              type="submit"
              disabled={isSubmitting || uploadedImages.length === 0}
              className="btn btn-primary h-20 text-xl font-black shadow-2xl rounded-[28px] group disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : uploadedImages.length === 0 ? 'Add Photo to Continue' : 'Submit My Listing'}
              {!isSubmitting && uploadedImages.length > 0 && (
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
