'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await sendOtp(email);
      setOtpSent(true);
      setSuccess('OTP sent! Check your email.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    try {
      const result = await verifyOtp(email, otp);
      if (result.isNewUser) {
        router.push('/register');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    }
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

      <div className="container animate-fade-in" style={{ maxWidth: '440px', padding: '2rem 1.5rem' }}>
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
            Sign in to your account
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

          {success && (
            <div
              style={{
                background: 'var(--secondary-glow)',
                color: 'var(--secondary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {success}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div
                style={{
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  color: 'var(--muted)',
                }}
              >
                OTP sent to <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{email}</span>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="otp"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  autoFocus
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    letterSpacing: '0.5em',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  height: '44px',
                  fontSize: '0.875rem',
                }}
              >
                Change email address
              </button>
            </form>
          )}
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            New here?{' '}
            <Link
              href="/register"
              style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
            >
              Register
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
