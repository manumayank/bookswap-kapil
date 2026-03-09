'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    board: '',
    school: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
            BookSwap
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
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoFocus
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" style={labelStyle}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  style={inputStyle}
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" style={labelStyle}>
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Your city"
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

              {/* School */}
              <div>
                <label htmlFor="school" style={labelStyle}>
                  School{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--muted-light)' }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="school"
                  name="school"
                  type="text"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="School name"
                  style={inputStyle}
                />
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
