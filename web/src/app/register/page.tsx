'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;

interface School {
  id: string;
  name: string;
  city: string;
  board: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    board: '',
    schoolId: '',
  });
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [error, setError] = useState('');
  const [searchingSchools, setSearchingSchools] = useState(false);

  // Search schools when user types
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

  // Debounce school search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (schoolSearch && !selectedSchoolName) {
        searchSchools(schoolSearch, form.city, form.board);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [schoolSearch, form.city, form.board, selectedSchoolName, searchSchools]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear school selection if city or board changes
    if (name === 'city' || name === 'board') {
      setForm(prev => ({ ...prev, schoolId: '' }));
      setSchoolSearch('');
      setSelectedSchoolName('');
      setSchools([]);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setForm({ ...form, schoolId: school.id });
    setSchoolSearch(school.name);
    setSelectedSchoolName(school.name);
    setShowSchoolDropdown(false);
    setSchools([]);
  };

  const handleSchoolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchoolSearch(value);
    setSelectedSchoolName('');
    setForm({ ...form, schoolId: '' });
    setShowSchoolDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || form.name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!form.phone || form.phone.length < 10) {
      setError('Phone must be at least 10 digits');
      return;
    }
    if (!form.city || form.city.length < 2) {
      setError('City is required');
      return;
    }

    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        className="glow-primary"
        style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }}
      />

      <div
        className="container animate-fade-in"
        style={{ maxWidth: '480px', padding: '2rem 1.5rem' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link
            href="/"
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            Sybrary
          </Link>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="card-premium" style={{ padding: '2.5rem' }}>
          {error && (
            <div
              style={{
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Name */}
              <div>
                <label htmlFor="name" style={labelStyle}>
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoFocus
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" style={labelStyle}>
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  required
                  style={inputStyle}
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" style={labelStyle}>
                  City *
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Your city"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Board */}
              <div>
                <label htmlFor="board" style={labelStyle}>
                  School Board{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--muted-light)' }}>
                    (optional)
                  </span>
                </label>
                <select
                  id="board"
                  name="board"
                  value={form.board}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select a board</option>
                  {BOARDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Search */}
              <div style={{ position: 'relative' }}>
                <label htmlFor="school" style={labelStyle}>
                  School{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--muted-light)' }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="school"
                  type="text"
                  value={schoolSearch}
                  onChange={handleSchoolInputChange}
                  onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                  placeholder={form.city ? "Search for your school..." : "Enter city first to search schools"}
                  disabled={!form.city}
                  style={{
                    ...inputStyle,
                    opacity: !form.city ? 0.6 : 1,
                  }}
                />
                {searchingSchools && (
                  <div style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '38px',
                    fontSize: '0.75rem',
                    color: 'var(--muted)'
                  }}>
                    Searching...
                  </div>
                )}
                {showSchoolDropdown && schools.length > 0 && (
                  <div
                    style={{
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
                    }}
                  >
                    {schools.map((school) => (
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
                          fontSize: '0.875rem',
                          color: 'var(--foreground)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--muted-lightest)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{school.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                          {school.city} • {school.board}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showSchoolDropdown && schoolSearch.length >= 2 && schools.length === 0 && !searchingSchools && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '4px',
                      padding: '12px 16px',
                      zIndex: 10,
                      fontSize: '0.875rem',
                      color: 'var(--muted)',
                    }}
                  >
                    No schools found. You can continue without selecting a school.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '2rem',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
            >
              Login
            </Link>
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-light)', marginTop: '0.75rem' }}>
            <Link href="/" style={{ color: 'var(--muted-light)', textDecoration: 'none' }}>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
