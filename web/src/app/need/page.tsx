'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BellRing, CheckCircle2, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { BOARD_OPTIONS, boardLabel } from '@/lib/labels';
import PageHeader from '@/components/ui/PageHeader';
import { Field, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';
import PriceInput from '@/components/forms/PriceInput';
import EmptyState from '@/components/ui/EmptyState';
import BookCard from '@/components/BookCard';
import SchoolSuggestions, { type SchoolOption } from '@/components/forms/SchoolSuggestions';

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const SUBJECTS = [
  'Maths', 'Science', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'Sanskrit', 'Social Science', 'History',
  'Geography', 'Computer Science', 'Olympiad', 'Others',
];

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  board?: string;
  class?: number;
  subject?: string;
  sellingPrice: number;
  buyingPrice?: number | null;
  condition?: string;
  city: string;
  status: string;
  images: { imageUrl: string }[];
  items: { subject: string; title?: string }[];
  school?: { name: string; city: string; board: string };
  user: { id: string; name: string; city: string };
}

const EMPTY_FILTERS = {
  board: '',
  class: '',
  city: '',
  schoolId: '',
  subjects: [] as string[],
  maxPrice: '',
};

export default function NeedPage() {
  const [step, setStep] = useState<'filters' | 'results' | 'request'>('filters');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [searchingSchools, setSearchingSchools] = useState(false);

  // Results
  const [matches, setMatches] = useState<Listing[]>([]);
  const [requestCreated, setRequestCreated] = useState(false);
  const [formError, setFormError] = useState('');
  const [cityError, setCityError] = useState('');

  const searchSchools = useCallback(async (query: string, city: string, board: string) => {
    if (query.length < 2) {
      setSchools([]);
      return;
    }
    setSearchingSchools(true);
    try {
      const params = new URLSearchParams();
      params.append('name', query);
      params.append('limit', '10');
      if (city) params.append('city', city);
      if (board) params.append('board', board);

      const { data } = await api.get(`/schools?${params.toString()}`);
      setSchools(data.data?.schools || []);
    } catch (err) {
      console.error('Failed to search schools:', err);
      setSchools([]);
    } finally {
      setSearchingSchools(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (schoolSearch && !selectedSchoolName) {
        searchSchools(schoolSearch, filters.city, filters.board);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [schoolSearch, filters.city, filters.board, selectedSchoolName, searchSchools]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field === 'city') setCityError('');
    if (field === 'city' || field === 'board') {
      setFilters((prev) => ({ ...prev, schoolId: '' }));
      setSchoolSearch('');
      setSelectedSchoolName('');
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFilters((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleSchoolSelect = (school: SchoolOption) => {
    setFilters((prev) => ({ ...prev, schoolId: school.id }));
    setSchoolSearch(school.name);
    setSelectedSchoolName(school.name);
    setShowSchoolDropdown(false);
  };

  const handleFindMatches = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!filters.city) {
      setCityError('Enter your city so we can show books nearby.');
      document.getElementById('need-city')?.focus();
      return;
    }

    setFormError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/requests/find-matches', {
        board: filters.board || undefined,
        class: filters.class ? parseInt(filters.class) : undefined,
        city: filters.city,
        schoolId: filters.schoolId || undefined,
        subjects: filters.subjects,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      });

      setMatches(data.data?.listings || []);
      setStep('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err.response?.data?.error || "We couldn't run the search. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!filters.board || !filters.class) {
      setFormError('A request needs a board and a class. Change your search to add them.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await api.post('/requests', {
        board: filters.board,
        class: parseInt(filters.class),
        city: filters.city,
        schoolId: filters.schoolId || undefined,
        subjects: filters.subjects,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      });
      setRequestCreated(true);
      setStep('request');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err.response?.data?.error || "We couldn't save your request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToFilters = () => {
    setFormError('');
    setStep('filters');
  };

  const searchSummary = (
    <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Your search">
      <span className="badge badge-muted">{filters.city}</span>
      {filters.class && <span className="badge badge-primary">Class {filters.class}</span>}
      {filters.board && <span className="badge badge-primary">{boardLabel(filters.board)}</span>}
      {selectedSchoolName && <span className="badge badge-muted">{selectedSchoolName}</span>}
      {filters.subjects.map((s) => (
        <span key={s} className="badge badge-muted">
          {s}
        </span>
      ))}
      {filters.maxPrice && <span className="badge badge-muted">Up to ₹{Number(filters.maxPrice).toLocaleString('en-IN')}</span>}
    </div>
  );

  const requestButtonLabel = isSubmitting ? 'Saving request…' : 'Notify me when it’s listed';

  return (
    <div className="container max-w-5xl py-10 md:py-14">
      {step === 'filters' && (
        <>
          <PageHeader
            back={{ href: '/', label: 'Home' }}
            title="Find books for your child"
            description="Tell us the class and city. We’ll show what’s listed now, or save a request and tell you when a match turns up."
          />

          <form onSubmit={handleFindMatches} noValidate className="card-flat max-w-2xl p-5 sm:p-8 animate-fade-in">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field id="need-city" label="City" error={cityError} className="sm:col-span-1">
                  <input
                    {...fieldA11y('need-city', { error: cityError })}
                    type="text"
                    autoComplete="address-level2"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Bengaluru"
                    className={`${controlClass} ${cityError ? invalidClass : ''}`}
                  />
                </Field>

                <Field id="need-class" label="Class">
                  <select
                    id="need-class"
                    value={filters.class}
                    onChange={(e) => handleFilterChange('class', e.target.value)}
                    className={controlClass}
                  >
                    <option value="">Any class</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="need-board" label="Board">
                  <select
                    id="need-board"
                    value={filters.board}
                    onChange={(e) => handleFilterChange('board', e.target.value)}
                    className={controlClass}
                  >
                    <option value="">Any board</option>
                    {BOARD_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {boardLabel(b)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field id="need-school" label="School" optional hint={!filters.city ? 'Add your city first to search schools.' : undefined}>
                <div className="relative">
                  <input
                    {...fieldA11y('need-school', { hint: !filters.city })}
                    autoComplete="off"
                    type="text"
                    role="combobox"
                    aria-expanded={showSchoolDropdown && schoolSearch.length >= 2}
                    aria-controls="need-school-suggestions"
                    aria-autocomplete="list"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSelectedSchoolName('');
                      setFilters((prev) => ({ ...prev, schoolId: '' }));
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSchoolDropdown(false)}
                    placeholder={filters.city ? 'Search by school name' : 'Add your city first'}
                    disabled={!filters.city}
                    className={`${controlClass} pr-11 disabled:cursor-not-allowed disabled:opacity-60`}
                  />
                  {searchingSchools && (
                    <Loader2
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted"
                      aria-label="Searching schools"
                    />
                  )}
                  <SchoolSuggestions
                    listId="need-school-suggestions"
                    open={showSchoolDropdown && !searchingSchools}
                    schools={schools}
                    onSelect={handleSchoolSelect}
                  />
                </div>
              </Field>

              <fieldset>
                <legend className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                  Subjects <span className="text-[13px] font-normal text-muted">Pick any that apply</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      className="chip"
                      aria-pressed={filters.subjects.includes(subject)}
                      onClick={() => handleSubjectToggle(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Field id="need-max" label="Budget" optional hint="The most you’d pay for the set.">
                <div className="max-w-[240px]">
                  <PriceInput
                    {...fieldA11y('need-max', { hint: true })}
                    min={0}
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="500"
                  />
                </div>
              </Field>

              {formError && <FormAlert>{formError}</FormAlert>}

              <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full sm:w-auto sm:self-start">
                <Search size={18} strokeWidth={2.5} aria-hidden />
                {isLoading ? 'Searching…' : 'Find books'}
              </button>
            </div>
          </form>
        </>
      )}

      {step === 'results' && (
        <div className="animate-fade-in">
          <PageHeader
            title={
              matches.length > 0
                ? `${matches.length} ${matches.length === 1 ? 'book matches' : 'books match'} your search`
                : 'Nothing listed for this yet'
            }
            description={
              matches.length > 0
                ? 'Open a listing to see the details and send the seller a request.'
                : undefined
            }
            actions={
              <button type="button" onClick={backToFilters} className="btn btn-outline">
                <SlidersHorizontal size={18} strokeWidth={2.25} aria-hidden />
                Change search
              </button>
            }
          />
          {searchSummary}

          {matches.length > 0 ? (
            <>
              <ul className="grid-marketplace">
                {matches.map((listing) => (
                  <li key={listing.id}>
                    <BookCard
                      id={listing.id}
                      title={listing.title}
                      sellingPrice={listing.sellingPrice}
                      buyingPrice={listing.buyingPrice}
                      condition={listing.condition}
                      category={listing.category}
                      city={listing.city}
                      imageUrl={listing.images?.[0]?.imageUrl}
                      board={listing.board}
                      classLevel={listing.class}
                      schoolName={listing.school?.name}
                    />
                  </li>
                ))}
              </ul>

              <div className="card-soft mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Not quite right?</p>
                  <p className="text-sm text-muted">Save this search and we’ll tell you when a new match is listed.</p>
                </div>
                <button type="button" onClick={handleCreateRequest} disabled={isSubmitting} className="btn btn-outline shrink-0">
                  <BellRing size={18} strokeWidth={2.25} aria-hidden />
                  {requestButtonLabel}
                </button>
              </div>
              {formError && <FormAlert className="mt-4">{formError}</FormAlert>}
            </>
          ) : (
            <div className="max-w-2xl">
              <EmptyState
                icon={BellRing}
                title="Save a request"
                actions={
                  <>
                    <button type="button" onClick={handleCreateRequest} disabled={isSubmitting} className="btn btn-primary">
                      {requestButtonLabel}
                    </button>
                    <button type="button" onClick={backToFilters} className="btn btn-outline">
                      Change search
                    </button>
                  </>
                }
              >
                <p>No parent has listed books for this search yet. Save a request and we’ll notify you as soon as one does.</p>
                {formError && <FormAlert className="mt-5 text-left">{formError}</FormAlert>}
              </EmptyState>
            </div>
          )}
        </div>
      )}

      {step === 'request' && requestCreated && (
        <div className="mx-auto max-w-xl animate-fade-in">
          <EmptyState
            icon={CheckCircle2}
            tone="secondary"
            title="Request saved"
            actions={
              <>
                <Link href="/dashboard" className="btn btn-primary">
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep('filters');
                    setMatches([]);
                    setRequestCreated(false);
                    setFilters(EMPTY_FILTERS);
                    setSchoolSearch('');
                    setSelectedSchoolName('');
                  }}
                  className="btn btn-outline"
                >
                  Start a new search
                </button>
              </>
            }
          >
            <p>
              We’ll message you on WhatsApp and in the app when someone lists books for Class {filters.class},{' '}
              {boardLabel(filters.board)} in {filters.city}.
            </p>
          </EmptyState>
        </div>
      )}
    </div>
  );
}
