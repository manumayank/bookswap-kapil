'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { boardLabel } from '@/lib/labels';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const SUBJECTS = [
  'Maths', 'Science', 'Physics', 'Chemistry', 'Biology',
  'English', 'Hindi', 'Sanskrit', 'Social Science', 'History',
  'Geography', 'Computer Science', 'Olympiad', 'Others'
];

interface School {
  id: string;
  name: string;
  city: string;
  board: string;
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  board?: string;
  class?: number;
  subject?: string;
  sellingPrice: number;
  city: string;
  status: string;
  images: { imageUrl: string }[];
  items: { subject: string; title?: string }[];
  school?: { name: string; city: string; board: string };
  user: { id: string; name: string; city: string };
}

export default function NeedPage() {
  const router = useRouter();
  const [step, setStep] = useState<'filters' | 'results' | 'request'>('filters');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    board: '',
    class: '',
    city: '',
    schoolId: '',
    subjects: [] as string[],
    maxPrice: '',
  });
  
  // School search
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [searchingSchools, setSearchingSchools] = useState(false);
  
  // Results
  const [matches, setMatches] = useState<Listing[]>([]);
  const [requestCreated, setRequestCreated] = useState(false);
  const [formError, setFormError] = useState('');

  // Search schools
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
    setFilters(prev => ({ ...prev, [field]: value }));
    if (field === 'city' || field === 'board') {
      setFilters(prev => ({ ...prev, schoolId: '' }));
      setSchoolSearch('');
      setSelectedSchoolName('');
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFilters(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSchoolSelect = (school: School) => {
    setFilters(prev => ({ ...prev, schoolId: school.id }));
    setSchoolSearch(school.name);
    setSelectedSchoolName(school.name);
    setShowSchoolDropdown(false);
  };

  const handleFindMatches = async () => {
    if (!filters.city) {
      setFormError('Please enter your city');
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
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!filters.board || !filters.class) {
      setFormError('Please select a board and class to raise a request. Use "Modify Search" to add them.');
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
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Could not create your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSeller = (listingId: string) => {
    router.push(`/listings/${listingId}`);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: 'var(--foreground)',
    marginBottom: '0.5rem',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/"
              aria-label="Back"
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center hover:bg-muted-extra-light transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <span aria-hidden style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>←</span>
            </Link>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {step === 'filters' && 'I Need Books'}
                {step === 'results' && `Found ${matches.length} Match${matches.length !== 1 ? 'es' : ''}`}
                {step === 'request' && 'Request Raised'}
              </h1>
              <p style={{ color: 'var(--muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                {step === 'filters' && 'Tell us what you are looking for'}
                {step === 'results' && matches.length > 0 
                  ? 'Contact sellers to get these books' 
                  : 'No matches found. Raise a request to get notified when books become available.'}
                {step === 'request' && 'We will notify you when someone lists matching books'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Step 1: Filters */}
        {step === 'filters' && (
          <div className="card-flat" style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* City */}
              <div>
                <label htmlFor="need-city" style={labelStyle}>Your City *</label>
                <input
                  id="need-city"
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="e.g., Delhi, Gurgaon"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Class */}
              <div>
                <label htmlFor="need-class" style={labelStyle}>Class/Grade</label>
                <select
                  id="need-class"
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Any Class</option>
                  {CLASSES.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              {/* Board */}
              <div>
                <label htmlFor="need-board" style={labelStyle}>School Board</label>
                <select
                  id="need-board"
                  value={filters.board}
                  onChange={(e) => handleFilterChange('board', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Any Board</option>
                  {BOARDS.map(b => (
                    <option key={b} value={b}>{boardLabel(b)}</option>
                  ))}
                </select>
              </div>

              {/* School Search */}
              <div style={{ position: 'relative' }}>
                <label htmlFor="need-school" style={labelStyle}>School</label>
                <input
                  id="need-school"
                  autoComplete="off"
                  type="text"
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setSelectedSchoolName('');
                    setFilters(prev => ({ ...prev, schoolId: '' }));
                    setShowSchoolDropdown(true);
                  }}
                  onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                  placeholder={filters.city ? "Search school..." : "Enter city first"}
                  disabled={!filters.city}
                  style={{ width: '100%', opacity: !filters.city ? 0.6 : 1 }}
                />
                {showSchoolDropdown && schools.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}>
                    {schools.map(school => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => handleSchoolSelect(school)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{school.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {school.city} • {boardLabel(school.board)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subjects */}
              <div>
                <p id="need-subjects" style={labelStyle}>Subjects Needed</p>
                <div role="group" aria-labelledby="need-subjects" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      aria-pressed={filters.subjects.includes(subject)}
                      onClick={() => handleSubjectToggle(subject)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '9999px',
                        border: '1px solid',
                        borderColor: filters.subjects.includes(subject) ? 'var(--primary)' : 'var(--border)',
                        background: filters.subjects.includes(subject) ? 'var(--primary)' : 'transparent',
                        color: filters.subjects.includes(subject) ? 'white' : 'var(--foreground)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Price */}
              <div>
                <label htmlFor="need-max" style={labelStyle}>Maximum Budget (₹)</label>
                <input
                  id="need-max"
                  min={0}
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="e.g., 500"
                  style={{ width: '100%' }}
                />
              </div>

              {formError && (
                <p role="alert" className="p-3 rounded-xl bg-accent/10 text-accent text-sm font-medium">
                  {formError}
                </p>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleFindMatches}
                disabled={isLoading || !filters.city}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '1rem',
                }}
              >
                {isLoading ? 'Searching...' : 'Find Books'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Results */}
        {step === 'results' && (
          <div>
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setStep('filters');
              }}
              className="btn btn-outline"
              style={{ marginBottom: '1.5rem' }}
            >
              ← Modify Search
            </button>

            {matches.length > 0 ? (
              <div>
                <div className="grid-marketplace">
                  {matches.map(listing => (
                    <div key={listing.id} className="card-flat" style={{ padding: '1.5rem' }}>
                      {listing.images?.[0] && (
                        <img
                          src={listing.images[0].imageUrl}
                          alt={listing.title}
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                          }}
                        />
                      )}
                      <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>{listing.title}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                        {[listing.board && boardLabel(listing.board), listing.class && `Class ${listing.class}`, listing.city]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      {listing.school && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>
                          {listing.school.name}
                        </p>
                      )}
                      {listing.items && listing.items.length > 0 && (
                        <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                          Subjects: {listing.items.map(i => i.subject).join(', ')}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                          ₹{listing.sellingPrice}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleContactSeller(listing.id)}
                          className="btn btn-primary"
                          style={{ height: '40px', padding: '0 16px', fontSize: '0.875rem' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-flat" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <h2 style={{ margin: '0 0 0.5rem 0' }}>No Books Found</h2>
                <p style={{ color: 'var(--muted)', margin: '0 0 2rem 0' }}>
                  We could not find any books matching your criteria. 
                  Raise a request and we will notify you when someone lists matching books.
                </p>
                {formError && (
                  <p role="alert" className="mb-4 p-3 rounded-xl bg-accent/10 text-accent text-sm font-medium text-left">
                    {formError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCreateRequest}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {isSubmitting ? 'Creating Request...' : 'Raise Request'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Request Created */}
        {step === 'request' && requestCreated && (
          <div className="card-flat" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>Request Raised!</h2>
            <p style={{ color: 'var(--muted)', margin: '0 0 2rem 0' }}>
              We will notify you via WhatsApp or app notification when someone lists 
              books matching your requirements.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep('filters');
                  setMatches([]);
                  setRequestCreated(false);
                  setFilters({
                    board: '',
                    class: '',
                    city: '',
                    schoolId: '',
                    subjects: [],
                    maxPrice: '',
                  });
                }}
                className="btn btn-outline"
              >
                Search for More Books
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
