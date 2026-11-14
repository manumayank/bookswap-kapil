"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Home as HomeIcon,
  ImagePlus,
  MapPin,
  PencilRuler,
  School as SchoolIcon,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { BOARD_OPTIONS, boardLabel, conditionLabel } from '@/lib/labels';
import { Field, FieldError, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';
import PriceInput from '@/components/forms/PriceInput';
import SchoolSuggestions, { type SchoolOption } from '@/components/forms/SchoolSuggestions';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const CATEGORIES = [
  { label: 'Textbook', value: 'BOOK', icon: BookOpen },
  { label: 'Stationery', value: 'STATIONERY', icon: PencilRuler },
] as const;
const CONDITIONS = ['HARDLY_USED', 'WELL_MAINTAINED', 'MARKER_USED', 'STAINS', 'TORN_PAGES'] as const;
const PICKUP_OPTIONS = [
  { label: 'School gate', hint: 'Meet at drop-off or pickup time', value: 'SCHOOL_GATE', icon: SchoolIcon },
  { label: 'My home', hint: 'The buyer collects from you', value: 'HOME', icon: HomeIcon },
  { label: 'Public place', hint: 'A mall, park or metro station', value: 'PUBLIC', icon: MapPin },
] as const;
const MAX_PHOTOS = 4;
const STEPS = ['Photos', 'Details', 'Price'] as const;

interface Photo {
  file: File;
  url: string;
}

type Values = {
  title: string;
  category: string;
  condition: string;
  board: string;
  class: string;
  subject: string;
  city: string;
  sector: string;
  pickupLocation: string;
  description: string;
  buyingPrice: string;
  sellingPrice: string;
};

type ErrorKey = keyof Values | 'photos' | 'school';
type Errors = Partial<Record<ErrorKey, string>>;

const EMPTY: Values = {
  title: '',
  category: '',
  condition: '',
  board: '',
  class: '',
  subject: '',
  city: '',
  sector: '',
  pickupLocation: '',
  description: '',
  buyingPrice: '',
  sellingPrice: '',
};

// First focusable element for each error key
const FOCUS_ID: Record<ErrorKey, string> = {
  photos: 'photo-input-0',
  title: 'sell-title',
  category: 'sell-category-BOOK',
  condition: `sell-condition-${CONDITIONS[0]}`,
  board: 'sell-board',
  class: 'sell-class',
  subject: 'sell-subject',
  school: 'sell-school',
  city: 'sell-city',
  sector: 'sell-sector',
  pickupLocation: `sell-pickup-${PICKUP_OPTIONS[0].value}`,
  description: 'sell-description',
  buyingPrice: 'sell-mrp',
  sellingPrice: 'sell-price',
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, hydrate, user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState<{ photosFailed: boolean } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;
  const topRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedSchoolName, setSelectedSchoolName] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Start with the seller's own city
  useEffect(() => {
    if (user?.city) setValues((v) => (v.city ? v : { ...v, city: user.city }));
  }, [user]);

  // Release preview object URLs on unmount
  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  // Move to the top of the new step and put focus on its heading
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [step]);

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

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => {
      const next = [...prev, ...added];
      next.slice(MAX_PHOTOS).forEach((p) => URL.revokeObjectURL(p.url));
      return next.slice(0, MAX_PHOTOS);
    });
    setErrors((prev) => ({ ...prev, photos: undefined }));
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateStep = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (photos.length === 0) e.photos = 'Add a photo of the front cover to continue.';
    }
    if (s === 1) {
      if (!values.title.trim()) e.title = 'Add a title, for example the book name and class.';
      if (!values.category) e.category = 'Choose textbook or stationery.';
      if (!values.condition) e.condition = 'Choose the condition that fits best.';
      if (!values.subject.trim()) e.subject = 'Add the subject.';
      if (!values.description.trim()) e.description = 'Add a short description for buyers.';
      if (!values.board) e.board = 'Choose the board.';
      if (!values.class) e.class = 'Choose the class.';
      if (!schoolSearch.trim()) e.school = 'Add the school name.';
      if (!values.city.trim()) e.city = 'Add your city.';
      if (!values.pickupLocation) e.pickupLocation = 'Choose where to hand over the item.';
    }
    if (s === 2) {
      if (!(Number(values.sellingPrice) >= 1)) e.sellingPrice = 'Enter your selling price in rupees.';
    }
    return e;
  };

  const showErrors = (e: Errors) => {
    setErrors(e);
    const first = Object.keys(e)[0] as ErrorKey | undefined;
    if (first) {
      const el = document.getElementById(FOCUS_ID[first]);
      el?.focus();
      if (first === 'photos') topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return !first;
  };

  const goNext = () => {
    if (!showErrors(validateStep(step))) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    if (!isAuthenticated) return;

    // Re-check every step before sending
    for (let s = 0; s < STEPS.length; s++) {
      const stepErrors = validateStep(s);
      if (Object.keys(stepErrors).length > 0) {
        setStep(s);
        setTimeout(() => showErrors(stepErrors), 0);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    const buyingPriceRaw = Number(values.buyingPrice);

    try {
      // Use schoolId if picked from the list, otherwise send schoolName for auto-creation
      const payload: any = {
        title: values.title,
        description: values.description,
        category: values.category,
        condition: values.condition,
        board: values.board,
        class: Number(values.class),
        subject: values.subject,
        city: values.city,
        sector: values.sector || undefined,
        pickupLocation: values.pickupLocation,
        // MRP is optional; the API rejects 0, so omit it when empty
        buyingPrice: buyingPriceRaw > 0 ? buyingPriceRaw : undefined,
        sellingPrice: Number(values.sellingPrice),
      };

      if (selectedSchoolId) {
        payload.schoolId = selectedSchoolId;
      } else if (schoolSearch.trim()) {
        payload.schoolName = schoolSearch.trim();
      }

      const { data } = await api.post('/listings', payload);

      if (data.success) {
        let photosFailed = false;
        if (photos.length > 0 && data.data?.id) {
          const imageFormData = new FormData();
          photos.forEach((p) => imageFormData.append('images', p.file));
          try {
            await api.post(`/listings/${data.data.id}/images`, imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (imgErr) {
            console.error('Image upload failed:', imgErr);
            photosFailed = true;
          }
        }

        setSubmitted({ photosFailed });
        setValues(EMPTY);
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
        setSelectedSchoolId('');
        setSelectedSchoolName('');
        setSchoolSearch('');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setSubmitError(data.error || "We couldn't submit your listing. Try again.");
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || "We couldn't reach Sybrary. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isHydrated) {
    return (
      <div className="container max-w-6xl py-12 md:py-16" aria-busy="true">
        <div className="skeleton mb-4 h-12 max-w-sm" />
        <div className="skeleton mb-10 h-6 max-w-md" />
        <div className="skeleton mb-8 h-12 max-w-xl" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="skeleton h-96 rounded-lg" />
          <div className="skeleton hidden h-96 rounded-lg lg:block" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-xl py-16 md:py-24 animate-fade-in">
        <EmptyState
          icon={BookOpen}
          title="Log in to list your books"
          actions={
            <>
              <Link href="/login" className="btn btn-primary">
                Log in
              </Link>
              <Link href="/browse" className="btn btn-outline">
                Browse books instead
              </Link>
            </>
          }
        >
          <p>You’ll need a photo of the front cover and your price.</p>
        </EmptyState>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container max-w-xl py-16 md:py-24 animate-fade-in">
        <EmptyState
          icon={CheckCircle2}
          tone="secondary"
          title="Submitted for review"
          actions={
            <Link href="/dashboard" className="btn btn-primary">
              Go to dashboard
            </Link>
          }
        >
          <p>Our team checks every listing before buyers can see it. We’ll notify you when yours is live.</p>
          {submitted.photosFailed && (
            <p className="mt-3 font-semibold text-foreground">
              Your photos didn’t upload. You can add them from your dashboard.
            </p>
          )}
          <p className="mt-3 text-sm">Taking you to your dashboard…</p>
        </EmptyState>
      </div>
    );
  }

  const mrp = Number(values.buyingPrice);
  const price = Number(values.sellingPrice);
  const savings = mrp > 0 && price > 0 && price < mrp ? mrp - price : 0;
  const isLast = step === STEPS.length - 1;

  const preview = (
    <ListingPreview
      photoUrl={photos[0]?.url}
      values={values}
      schoolName={schoolSearch.trim()}
      savings={savings}
    />
  );

  return (
    <div ref={topRef} className="container max-w-6xl scroll-mt-24 py-10 md:py-14">
      <PageHeader
        back={{ href: '/', label: 'Home' }}
        title="List your books"
        description="Add photos, details and your price. Buyers see your listing once our team has checked it."
      />

      <Stepper step={step} onJump={(i) => i < step && setStep(i)} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <form noValidate onSubmit={handleSubmit} className="min-w-0 animate-fade-in" key={step}>
          {/* Step 1: Photos */}
          {step === 0 && (
            <section aria-labelledby="step-heading">
              <StepHeading ref={stepHeadingRef}>Add photos</StepHeading>
              <p className="mb-6 text-muted">
                Start with the front cover. Add the back or a few inside pages if they show the condition.
              </p>

              <div className="card-flat p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
                    const photo = photos[i];
                    const isMain = i === 0;
                    if (photo) {
                      return (
                        <div
                          key={photo.url}
                          className="relative aspect-square overflow-hidden rounded-md border-2 border-edge bg-muted-extra-light"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={isMain ? 'Front cover preview' : `Photo ${i + 1} preview`}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label={`Remove ${isMain ? 'front cover' : `photo ${i + 1}`}`}
                            className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-edge bg-card text-foreground shadow-pop-sm hover:bg-muted-extra-light"
                          >
                            <X size={18} strokeWidth={2.5} aria-hidden />
                          </button>
                          {isMain && <span className="badge badge-sun absolute bottom-2 left-2">Cover</span>}
                        </div>
                      );
                    }
                    // Only the next empty slot is an active picker
                    const isNextSlot = i === photos.length;
                    const inputId = `photo-input-${i}`;
                    return (
                      <div key={`slot-${i}`} className="relative aspect-square">
                        {isNextSlot && (
                          <input
                            id={inputId}
                            type="file"
                            className="peer sr-only"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            aria-describedby={errors.photos ? 'photos-error' : 'photos-hint'}
                          />
                        )}
                        <label
                          htmlFor={isNextSlot ? inputId : undefined}
                          aria-disabled={!isNextSlot}
                          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 text-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
                            isNextSlot
                              ? `cursor-pointer bg-muted-extra-light text-foreground hover:border-solid hover:border-edge ${
                                  errors.photos ? 'border-danger' : 'border-edge'
                                }`
                              : 'cursor-default border-card-border text-muted-light'
                          }`}
                        >
                          {isNextSlot ? (
                            <>
                              <span
                                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-edge ${
                                  isMain ? 'bg-sun text-ink' : 'bg-card'
                                }`}
                                aria-hidden
                              >
                                <ImagePlus size={20} strokeWidth={2.25} />
                              </span>
                              <span className="text-sm font-bold leading-tight">
                                {isMain ? 'Add front cover' : 'Add photo'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[13px] font-semibold">Photo {i + 1}</span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p id="photos-hint" className="text-[13px] text-muted">
                    {photos.length} of {MAX_PHOTOS} photos. You can pick several at once.
                  </p>
                </div>
                <FieldError id="photos-error" message={errors.photos} />
              </div>
            </section>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <section aria-labelledby="step-heading" className="flex flex-col gap-6">
              <div>
                <StepHeading ref={stepHeadingRef}>Describe the item</StepHeading>
                <p className="text-muted">Parents search by class, board and school, so these matter most.</p>
              </div>

              <fieldset className="card-flat flex flex-col gap-5 p-5 sm:p-6">
                <legend className="sr-only">About the item</legend>
                <h3 className="text-lg font-bold" aria-hidden>
                  About the item
                </h3>

                <Field id="sell-title" label="Title" error={errors.title} hint="Name the book or set, e.g. NCERT Mathematics Class 10 (2024 edition)">
                  <input
                    {...fieldA11y('sell-title', { error: errors.title, hint: true })}
                    type="text"
                    value={values.title}
                    onChange={set('title')}
                    placeholder="NCERT Mathematics Class 10"
                    className={`${controlClass} ${errors.title ? invalidClass : ''}`}
                  />
                </Field>

                <RadioGroup
                  name="category"
                  legend="Type"
                  error={errors.category}
                  value={values.category}
                  onChange={(v) => {
                    setValues((s) => ({ ...s, category: v }));
                    setErrors((p) => ({ ...p, category: undefined }));
                  }}
                  options={CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
                  idPrefix="sell-category"
                />

                <RadioGroup
                  name="condition"
                  legend="Condition"
                  error={errors.condition}
                  value={values.condition}
                  onChange={(v) => {
                    setValues((s) => ({ ...s, condition: v }));
                    setErrors((p) => ({ ...p, condition: undefined }));
                  }}
                  options={CONDITIONS.map((c) => ({ value: c, label: conditionLabel(c) }))}
                  idPrefix="sell-condition"
                />

                <Field id="sell-subject" label="Subject" error={errors.subject}>
                  <input
                    {...fieldA11y('sell-subject', { error: errors.subject })}
                    type="text"
                    value={values.subject}
                    onChange={set('subject')}
                    placeholder="Mathematics"
                    className={`${controlClass} ${errors.subject ? invalidClass : ''}`}
                  />
                </Field>

                <Field
                  id="sell-description"
                  label="Description"
                  error={errors.description}
                  hint="Mention missing pages, highlighting, or anything included like a workbook."
                >
                  <textarea
                    {...fieldA11y('sell-description', { error: errors.description, hint: true })}
                    rows={4}
                    value={values.description}
                    onChange={set('description')}
                    placeholder="Clean copy, a few pencil notes in chapter 3. Comes with the lab manual."
                    className={`w-full resize-y ${errors.description ? invalidClass : ''}`}
                  />
                </Field>
              </fieldset>

              <fieldset className="card-flat flex flex-col gap-5 p-5 sm:p-6">
                <legend className="sr-only">Class and school</legend>
                <h3 className="text-lg font-bold" aria-hidden>
                  Class and school
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="sell-board" label="Board" error={errors.board}>
                    <select
                      {...fieldA11y('sell-board', { error: errors.board })}
                      value={values.board}
                      onChange={set('board')}
                      className={`${controlClass} ${errors.board ? invalidClass : ''}`}
                    >
                      <option value="">Choose board</option>
                      {BOARD_OPTIONS.map((board) => (
                        <option key={board} value={board}>
                          {boardLabel(board)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="sell-class" label="Class" error={errors.class}>
                    <select
                      {...fieldA11y('sell-class', { error: errors.class })}
                      value={values.class}
                      onChange={set('class')}
                      className={`${controlClass} ${errors.class ? invalidClass : ''}`}
                    >
                      <option value="">Choose class</option>
                      {CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field id="sell-school" label="School" error={errors.school}>
                  <div className="relative">
                    <input
                      {...fieldA11y('sell-school', { error: errors.school })}
                      type="text"
                      role="combobox"
                      aria-expanded={showSchoolDropdown && schoolSearch.length >= 2}
                      aria-controls="sell-school-suggestions"
                      aria-autocomplete="list"
                      value={schoolSearch}
                      autoComplete="off"
                      onChange={(e) => {
                        setSchoolSearch(e.target.value);
                        setSelectedSchoolName('');
                        setSelectedSchoolId('');
                        setShowSchoolDropdown(true);
                        if (errors.school) setErrors((p) => ({ ...p, school: undefined }));
                      }}
                      onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowSchoolDropdown(false);
                      }}
                      placeholder="Start typing the school name"
                      className={`${controlClass} ${errors.school ? invalidClass : ''}`}
                    />
                    <SchoolSuggestions
                      listId="sell-school-suggestions"
                      open={showSchoolDropdown && schoolSearch.length >= 2}
                      schools={schools}
                      onSelect={(school) => {
                        setSelectedSchoolId(school.id);
                        setSelectedSchoolName(school.name);
                        setSchoolSearch(school.name);
                        setShowSchoolDropdown(false);
                      }}
                      empty={
                        <div>
                          <p className="mb-3">
                            No school called <span className="font-semibold text-foreground">“{schoolSearch}”</span> yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSchoolName(schoolSearch);
                              setShowSchoolDropdown(false);
                            }}
                            className="btn btn-outline btn-sm h-auto min-h-[40px] max-w-full whitespace-normal py-2 text-left"
                          >
                            Add “{schoolSearch}” as a new school
                          </button>
                        </div>
                      }
                    />
                  </div>
                  {selectedSchoolName && (
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-secondary-dark">
                      <Check size={16} strokeWidth={3} aria-hidden />
                      {selectedSchoolId ? 'School selected' : 'We’ll add this school for you'}
                    </p>
                  )}
                </Field>
              </fieldset>

              <fieldset className="card-flat flex flex-col gap-5 p-5 sm:p-6">
                <legend className="sr-only">Pickup</legend>
                <h3 className="text-lg font-bold" aria-hidden>
                  Pickup
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="sell-city" label="City" error={errors.city}>
                    <input
                      {...fieldA11y('sell-city', { error: errors.city })}
                      type="text"
                      autoComplete="address-level2"
                      value={values.city}
                      onChange={set('city')}
                      placeholder="Bengaluru"
                      className={`${controlClass} ${errors.city ? invalidClass : ''}`}
                    />
                  </Field>
                  <Field id="sell-sector" label="Area or sector" optional>
                    <input
                      id="sell-sector"
                      type="text"
                      value={values.sector}
                      onChange={set('sector')}
                      placeholder="HSR Layout"
                      className={controlClass}
                    />
                  </Field>
                </div>

                <fieldset aria-describedby={errors.pickupLocation ? 'sell-pickup-error' : undefined}>
                  <legend className="mb-2 text-sm font-semibold">Where should the buyer collect it?</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PICKUP_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const id = `sell-pickup-${option.value}`;
                      return (
                        <label key={option.value} htmlFor={id} className="relative cursor-pointer">
                          <input
                            id={id}
                            type="radio"
                            name="pickupLocation"
                            value={option.value}
                            checked={values.pickupLocation === option.value}
                            onChange={() => {
                              setValues((s) => ({ ...s, pickupLocation: option.value }));
                              setErrors((p) => ({ ...p, pickupLocation: undefined }));
                            }}
                            className="peer sr-only"
                          />
                          <span
                            className={`flex h-full min-h-[64px] items-start gap-3 rounded-md border-2 bg-card p-3.5 transition-colors hover:border-edge peer-checked:border-edge peer-checked:bg-sun peer-checked:text-ink peer-checked:shadow-pop-sm peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&_.hint]:text-ink ${
                              errors.pickupLocation ? 'border-danger' : 'border-border'
                            }`}
                          >
                            <Icon size={20} strokeWidth={2.25} className="mt-0.5 shrink-0" aria-hidden />
                            <span>
                              <span className="block text-sm font-bold">{option.label}</span>
                              <span className="hint block text-[13px] leading-snug text-muted">{option.hint}</span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError id="sell-pickup-error" message={errors.pickupLocation} />
                </fieldset>
                <p className="text-[13px] text-muted">
                  Buyers only see your phone number and address after you accept their request.
                </p>
              </fieldset>
            </section>
          )}

          {/* Step 3: Price */}
          {step === 2 && (
            <section aria-labelledby="step-heading" className="flex flex-col gap-6">
              <div>
                <StepHeading ref={stepHeadingRef}>Set your price</StepHeading>
                <p className="text-muted">Adding the printed price (MRP) shows buyers how much they save.</p>
              </div>

              <div className="card-flat p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="sell-price" label="Your price" error={errors.sellingPrice}>
                    <PriceInput
                      {...fieldA11y('sell-price', { error: errors.sellingPrice })}
                      size="lg"
                      value={values.sellingPrice}
                      onChange={set('sellingPrice')}
                      placeholder="0"
                      className={errors.sellingPrice ? invalidClass : ''}
                    />
                  </Field>
                  <Field id="sell-mrp" label="MRP" optional>
                    <PriceInput
                      id="sell-mrp"
                      size="lg"
                      value={values.buyingPrice}
                      onChange={set('buyingPrice')}
                      placeholder="0"
                      aria-describedby="sell-savings"
                    />
                  </Field>
                </div>

                <div id="sell-savings" aria-live="polite" className="mt-5 min-h-[24px]">
                  {savings > 0 && (
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="badge badge-secondary text-[13px]">Buyers save {rupees(savings)}</span>
                      <span className="text-muted">{Math.round((savings / mrp) * 100)}% below the MRP</span>
                    </p>
                  )}
                  {mrp > 0 && price > mrp && (
                    <p className="text-sm text-muted">Your price is higher than the MRP. Check both amounts.</p>
                  )}
                </div>
              </div>

              <div className="lg:hidden">
                <h3 className="mb-3 text-lg font-bold">How buyers will see it</h3>
                <div className="max-w-[320px]">{preview}</div>
              </div>

              {submitError && <FormAlert>{submitError}</FormAlert>}
            </section>
          )}

          {/* Actions: sticky on phones */}
          <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center gap-3 border-t-2 border-edge bg-background px-4 py-3 sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
            {step > 0 && (
              <button type="button" onClick={goBack} className="btn btn-outline">
                Back
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 md:ml-auto md:flex-none md:px-8">
              {isLast ? (isSubmitting ? 'Submitting…' : 'Submit for review') : 'Continue'}
            </button>
          </div>
        </form>

        <aside className="hidden lg:sticky lg:top-28 lg:block" aria-label="Listing preview">
          <h2 className="mb-3 text-lg font-bold">Preview</h2>
          {preview}
          <p className="mt-4 text-[13px] text-muted">This is roughly how your listing will look in search.</p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

const StepHeading = forwardRef<HTMLHeadingElement, { children: React.ReactNode }>(function StepHeading(
  { children },
  ref,
) {
  return (
    <h2 id="step-heading" ref={ref} tabIndex={-1} className="mb-2 text-2xl outline-none md:text-3xl">
      {children}
    </h2>
  );
});

function Stepper({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Listing progress">
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          const circle = current
            ? 'bg-primary text-on-primary shadow-pop-sm'
            : done
              ? 'bg-secondary text-ink'
              : 'bg-card text-muted';
          const content = (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-edge text-sm font-extrabold ${circle}`}
                aria-hidden
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`text-sm font-bold ${current ? 'text-foreground' : 'text-muted'} ${current ? '' : 'hidden sm:inline'}`}>
                {label}
              </span>
            </>
          );
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none" aria-current={current ? 'step' : undefined}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="flex min-h-[40px] items-center gap-2 rounded-full pr-1 hover:underline decoration-primary decoration-2 underline-offset-4"
                  aria-label={`Back to step ${i + 1}: ${label}`}
                >
                  {content}
                </button>
              ) : (
                <span className="flex min-h-[40px] items-center gap-2">{content}</span>
              )}
              {i < STEPS.length - 1 && (
                <span className={`h-[3px] flex-1 rounded-full ${i < step ? 'bg-secondary' : 'bg-card-border'}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  idPrefix,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; icon?: LucideIcon }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  idPrefix: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${idPrefix}-error` : undefined}>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const id = `${idPrefix}-${o.value}`;
          const Icon = o.icon;
          return (
            <label key={o.value} htmlFor={id} className="cursor-pointer">
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted-extra-light peer-checked:border-edge peer-checked:bg-sun peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
                  error ? 'border-danger' : 'border-edge'
                }`}
              >
                {Icon && <Icon size={16} strokeWidth={2.25} aria-hidden />}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${idPrefix}-error`} message={error} />
    </fieldset>
  );
}

function ListingPreview({
  photoUrl,
  values,
  schoolName,
  savings,
}: {
  photoUrl?: string;
  values: Values;
  schoolName: string;
  savings: number;
}) {
  const price = Number(values.sellingPrice);
  const isStationery = values.category === 'STATIONERY';
  const Glyph = isStationery ? PencilRuler : BookOpen;
  const place = [schoolName, values.city].filter(Boolean);

  return (
    <div className="card-premium overflow-hidden" aria-hidden>
      <div className="relative aspect-[4/3] border-b-2 border-edge bg-sun">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink">
            <Glyph size={64} strokeWidth={1.75} />
          </div>
        )}
        <span className="sticker absolute left-3 top-3 text-lg">{price > 0 ? rupees(price) : '₹ —'}</span>
      </div>
      <div className="p-4">
        <p className={`line-clamp-2 text-lg font-bold leading-snug ${values.title ? '' : 'text-muted-light'}`}>
          {values.title || 'Your title appears here'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {values.class && <span className="badge badge-primary">Class {values.class}</span>}
          {values.board && <span className="badge badge-muted">{boardLabel(values.board)}</span>}
          {values.condition && <span className="badge badge-muted">{conditionLabel(values.condition)}</span>}
          {savings > 0 && <span className="badge badge-secondary">Save {rupees(savings)}</span>}
          {!values.class && !values.board && !values.condition && savings === 0 && (
            <span className="badge badge-muted">Class and board</span>
          )}
        </div>
        {place.length > 0 && (
          <div className="mt-3 text-sm text-muted">
            {place.map((p) => (
              <p key={p} className="truncate">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
