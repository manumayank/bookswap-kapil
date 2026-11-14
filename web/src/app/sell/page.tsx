"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BOARD_OPTIONS, boardLabel } from '@/lib/labels';

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
const MAX_PHOTOS = 4;

const LABEL = 'text-xs font-black uppercase tracking-[0.2em] text-muted-light block mb-4';

interface School {
  id: string;
  name: string;
  city: string;
  board: string;
}

interface Photo {
  file: File;
  url: string;
}

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Release preview object URLs on unmount
  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  // Search schools
  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchools([]);
      return;
    }
    try {
      const { data } = await api.get('/schools', { params: { name: query, limit: 10 } });
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => {
      const next = [...prev, ...added];
      next.slice(MAX_PHOTOS).forEach((p) => URL.revokeObjectURL(p.url));
      return next.slice(0, MAX_PHOTOS);
    });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated) return;

    if (photos.length === 0) {
      setStatus({ type: 'error', message: 'Please add at least one photo of the front cover.' });
      return;
    }

    // Validate school name is provided
    if (!schoolSearch.trim()) {
      setStatus({ type: 'error', message: 'Please enter a school name' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const buyingPriceRaw = Number(formData.get('buyingPrice'));

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
        sector: (formData.get('sector') as string) || undefined,
        pickupLocation: formData.get('pickupLocation') as string,
        // MRP is optional; the API rejects 0, so omit it when empty
        buyingPrice: buyingPriceRaw > 0 ? buyingPriceRaw : undefined,
        sellingPrice: Number(formData.get('sellingPrice')),
      };

      if (selectedSchoolId) {
        payload.schoolId = selectedSchoolId;
      } else if (schoolSearch.trim()) {
        payload.schoolName = schoolSearch.trim();
      }

      const { data } = await api.post('/listings', payload);

      if (data.success) {
        let imageWarning = '';
        if (photos.length > 0 && data.data?.id) {
          const imageFormData = new FormData();
          photos.forEach((p) => imageFormData.append('images', p.file));
          try {
            await api.post(`/listings/${data.data.id}/images`, imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (imgErr) {
            console.error('Image upload failed:', imgErr);
            imageWarning = ' (photos failed to upload — you can add them from your dashboard)';
          }
        }

        setStatus({ type: 'success', message: `Listing submitted for review!${imageWarning}` });
        form.reset();
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
        setSelectedSchoolId('');
        setSelectedSchoolName('');
        setSchoolSearch('');

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

  if (!isHydrated) {
    return (
      <div className="bg-background min-h-screen py-16 md:py-24" aria-busy="true">
        <div className="container max-w-3xl">
          <div className="h-14 skeleton max-w-sm mx-auto mb-6" />
          <div className="h-6 skeleton max-w-md mx-auto mb-16" />
          <div className="h-64 skeleton rounded-[28px] mb-8" />
          <div className="h-96 skeleton rounded-[28px]" />
        </div>
      </div>
    );
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
    <div className="bg-background min-h-screen py-16 md:py-24">
      <div className="container max-w-3xl">
        <header className="mb-14 md:mb-20 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="opacity-30" aria-hidden>/</span>
            <span>Post Listing</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">List your item</h1>
          <p className="text-muted font-medium text-lg max-w-md mx-auto leading-relaxed">
            Join our community of parents saving on school essentials.
          </p>
        </header>

        <form className="flex flex-col gap-12" onSubmit={handleSubmit}>
          {status && (
            <div
              role={status.type === 'error' ? 'alert' : 'status'}
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
          <section aria-labelledby="step-photos">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20" aria-hidden>
                01
              </span>
              <h2 id="step-photos" className="text-2xl font-black tracking-tight">Photos (Required)</h2>
            </div>

            <div className="card-flat p-6 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
                  const photo = photos[i];
                  const isMain = i === 0;
                  if (photo) {
                    return (
                      <div key={photo.url} className="aspect-square rounded-[24px] relative overflow-hidden border border-card-border">
                        <img src={photo.url} alt={isMain ? 'Front cover preview' : `Photo ${i + 1} preview`} className="absolute inset-0 w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove ${isMain ? 'front cover' : `photo ${i + 1}`}`}
                          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white text-lg font-bold flex items-center justify-center hover:bg-black/80"
                        >
                          <span aria-hidden>&times;</span>
                        </button>
                        {isMain && (
                          <span className="absolute bottom-2 left-2 badge badge-primary bg-card/90">Cover</span>
                        )}
                      </div>
                    );
                  }
                  // Only the next empty slot is an active picker
                  const isNextSlot = i === photos.length;
                  const inputId = `photo-input-${i}`;
                  return (
                    <div key={`slot-${i}`} className="aspect-square relative">
                      {isNextSlot && (
                        <input
                          id={inputId}
                          type="file"
                          className="sr-only peer"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                      )}
                      <label
                        htmlFor={isNextSlot ? inputId : undefined}
                        aria-disabled={!isNextSlot}
                        className={`absolute inset-0 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center p-4 group transition-all peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
                          isMain
                            ? 'border-primary bg-primary/5 hover:border-primary-dark'
                            : 'border-border'
                        } ${isNextSlot ? 'cursor-pointer hover:border-primary' : 'opacity-60 cursor-default'}`}
                      >
                        {isMain ? (
                          <>
                            <span className="mb-3 group-hover:scale-110 transition-transform" aria-hidden>
                              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-primary text-center">
                              Front Cover *
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl opacity-60 group-hover:opacity-100 group-hover:text-primary group-hover:scale-125 transition-all mb-2" aria-hidden>
                              +
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-light">
                              {isNextSlot ? 'Add photo' : 'Optional'}
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-muted-extra-light/50 border border-card-border flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0 mt-0.5" aria-hidden><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p className="text-xs text-muted font-medium leading-relaxed">
                  <span className="font-bold text-foreground">Required:</span> At least one front cover photo (up to {MAX_PHOTOS}).
                  Items with clear photos sell <span className="text-secondary font-bold">3x faster</span>.
                </p>
              </div>
            </div>
          </section>

          {/* Step 2: Item Details */}
          <section aria-labelledby="step-details">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20" aria-hidden>
                02
              </span>
              <h2 id="step-details" className="text-2xl font-black tracking-tight">Item Details</h2>
            </div>

            <div className="card-flat p-6 md:p-10 flex flex-col gap-10">
              {/* Title */}
              <div>
                <label htmlFor="sell-title" className={LABEL}>
                  What are you selling? *
                </label>
                <input
                  id="sell-title"
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
                  <label htmlFor="sell-category" className={LABEL}>
                    Category *
                  </label>
                  <select
                    id="sell-category"
                    name="category"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat === 'BOOK' ? 'Textbooks' : 'Stationery'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-condition" className={LABEL}>
                    Condition *
                  </label>
                  <select
                    id="sell-condition"
                    name="condition"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl cursor-pointer"
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
                  <label htmlFor="sell-board" className={LABEL}>
                    Board *
                  </label>
                  <select
                    id="sell-board"
                    name="board"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl cursor-pointer"
                  >
                    <option value="">Select board</option>
                    {BOARD_OPTIONS.map((board) => (
                      <option key={board} value={board}>{boardLabel(board)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-class" className={LABEL}>
                    Class *
                  </label>
                  <select
                    id="sell-class"
                    name="class"
                    required
                    className="w-full font-bold py-5 px-6 rounded-2xl cursor-pointer"
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
                <label htmlFor="sell-subject" className={LABEL}>
                  Subject *
                </label>
                <input
                  id="sell-subject"
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Science, English..."
                  className="w-full font-bold py-5 px-6 rounded-2xl"
                />
              </div>

              {/* School Search */}
              <div className="relative">
                <label htmlFor="sell-school" className={LABEL}>
                  School *
                </label>
                <input
                  id="sell-school"
                  type="text"
                  value={schoolSearch}
                  autoComplete="off"
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setSelectedSchoolName('');
                    setSelectedSchoolId('');
                    setShowSchoolDropdown(true);
                  }}
                  onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSchoolDropdown(false);
                  }}
                  placeholder="Type your school name..."
                  className="w-full font-bold py-5 px-6 rounded-2xl"
                />
                {showSchoolDropdown && schools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-card-border rounded-2xl mt-2 max-h-60 overflow-y-auto z-10 shadow-xl">
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
                        <div className="text-xs text-muted">{school.city} • {boardLabel(school.board)}</div>
                      </button>
                    ))}
                  </div>
                )}
                {showSchoolDropdown && schoolSearch.length >= 2 && schools.length === 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-card-border rounded-2xl mt-2 p-6 z-10 shadow-xl">
                    <div className="text-center">
                      <p className="text-muted mb-4">No schools found matching &quot;{schoolSearch}&quot;</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolName(schoolSearch);
                          setShowSchoolDropdown(false);
                        }}
                        className="btn btn-primary h-auto min-h-12 py-3 max-w-full whitespace-normal"
                      >
                        + Add &quot;{schoolSearch}&quot; as New School
                      </button>
                      <p className="text-xs text-muted mt-2">This school will be added to our database</p>
                    </div>
                  </div>
                )}
                {selectedSchoolName && (
                  <div className="mt-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center gap-2">
                    <span className="text-secondary" aria-hidden>✓</span>
                    <span className="text-sm font-medium">
                      {selectedSchoolId ? 'Selected:' : 'Adding new school:'} {selectedSchoolName}
                    </span>
                  </div>
                )}
              </div>

              {/* City & Sector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label htmlFor="sell-city" className={LABEL}>
                    City *
                  </label>
                  <input
                    id="sell-city"
                    name="city"
                    type="text"
                    required
                    placeholder="e.g. Delhi"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
                <div>
                  <label htmlFor="sell-sector" className={LABEL}>
                    Sector/Colony/Area
                  </label>
                  <input
                    id="sell-sector"
                    name="sector"
                    type="text"
                    placeholder="e.g. Sector 45, Gurgaon"
                    className="w-full font-bold py-5 px-6 rounded-2xl"
                  />
                </div>
              </div>

              {/* Pickup Location */}
              <fieldset>
                <legend className={LABEL}>Preferred Pickup Location *</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PICKUP_OPTIONS.map((option) => (
                    <label key={option.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="pickupLocation"
                        value={option.value}
                        required
                        className="sr-only peer"
                      />
                      <div className="p-6 rounded-2xl border-2 border-card-border bg-card text-center text-sm font-bold transition-all hover:border-primary hover:bg-muted-extra-light peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:font-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                        {option.label}
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Description */}
              <div>
                <label htmlFor="sell-description" className={LABEL}>
                  Description *
                </label>
                <textarea
                  id="sell-description"
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
          <section aria-labelledby="step-pricing">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20" aria-hidden>
                03
              </span>
              <h2 id="step-pricing" className="text-2xl font-black tracking-tight">Pricing</h2>
            </div>

            <div className="card-flat p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label htmlFor="sell-mrp" className={LABEL}>
                    Original Price (MRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-light" aria-hidden>
                      &#8377;
                    </span>
                    <input
                      id="sell-mrp"
                      name="buyingPrice"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="Optional"
                      className="w-full pl-12 pr-6 py-6 text-3xl font-black rounded-2xl placeholder:text-base placeholder:font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="sell-price" className={LABEL}>
                    Your Selling Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-light" aria-hidden>
                      &#8377;
                    </span>
                    <input
                      id="sell-price"
                      name="sellingPrice"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="0"
                      required
                      className="w-full pl-12 pr-6 py-6 text-3xl font-black rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-6 pt-10">
            <button
              type="submit"
              disabled={isSubmitting || photos.length === 0}
              className="btn btn-primary h-16 md:h-20 text-lg md:text-xl font-black shadow-2xl rounded-[28px] group"
            >
              {isSubmitting ? 'Submitting...' : photos.length === 0 ? 'Add Photo to Continue' : 'Submit My Listing'}
              {!isSubmitting && photos.length > 0 && (
                <span className="group-hover:translate-x-2 transition-transform inline-block ml-2" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              )}
            </button>
            <p className="text-center text-xs text-muted-light font-medium max-w-xs mx-auto">
              By clicking Submit, you agree to follow our Community Guidelines.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
