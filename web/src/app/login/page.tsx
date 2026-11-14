'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import AuthCard, { textLinkClass } from '@/components/forms/AuthCard';
import { Field, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const resetMessages = () => {
    setFieldError('');
    setFormError('');
    setNotice('');
  };

  const requestCode = async () => {
    await sendOtp(email.trim());
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !email.includes('@')) {
      setFieldError('Enter an email address like name@example.com.');
      return;
    }

    try {
      await requestCode();
      setOtpSent(true);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "We couldn't send the code. Check the email address and try again.");
    }
  };

  const handleResend = async () => {
    resetMessages();
    setOtp('');
    try {
      await requestCode();
      setNotice('New code sent. Use the latest email.');
    } catch (err: any) {
      setFormError(err.response?.data?.error || "We couldn't send a new code. Try again in a minute.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (otp.length !== 6) {
      setFieldError('Enter all 6 digits from the email.');
      return;
    }

    try {
      const result = await verifyOtp(email.trim(), otp);
      router.push(result.isNewUser ? '/register' : '/dashboard');
    } catch (err: any) {
      setFieldError(err.response?.data?.error || 'That code is wrong or has expired. Check the email or send a new code.');
    }
  };

  const changeEmail = () => {
    setOtpSent(false);
    setOtp('');
    resetMessages();
  };

  return (
    <AuthCard
      title={otpSent ? 'Check your email' : 'Log in to Sybrary'}
      description={
        otpSent ? (
          <p>
            We sent a 6-digit code to <span className="font-bold text-foreground break-all">{email}</span>.
          </p>
        ) : (
          <p>We’ll email you a 6-digit code. No password to remember.</p>
        )
      }
      footer={
        <>
          <p>
            New to Sybrary?{' '}
            <Link href="/register" className={textLinkClass}>
              Create an account
            </Link>
          </p>
          <p className="mt-3">
            <Link href="/" className="font-semibold text-muted hover:text-foreground hover:underline decoration-primary decoration-2 underline-offset-4">
              Back to home
            </Link>
          </p>
        </>
      }
    >
      {formError && <FormAlert className="mb-5">{formError}</FormAlert>}
      {notice && (
        <FormAlert tone="success" className="mb-5">
          {notice}
        </FormAlert>
      )}

      {!otpSent ? (
        <form onSubmit={handleSendOtp} noValidate>
          <Field id="email" label="Email address" error={fieldError}>
            <div className="relative">
              <Mail size={18} strokeWidth={2.25} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                {...fieldA11y('email', { error: fieldError })}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className={`${controlClass} pl-11 ${fieldError ? invalidClass : ''}`}
              />
            </div>
          </Field>
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg mt-6 w-full">
            {isLoading ? 'Sending code…' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate>
          <Field id="otp" label="6-digit code" error={fieldError} hint="It can take a minute to arrive. Check spam if you don’t see it.">
            <input
              {...fieldA11y('otp', { error: fieldError, hint: true })}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className={`h-16 w-full text-center text-3xl font-extrabold tabular-nums tracking-[0.45em] placeholder:text-muted-light/50 ${fieldError ? invalidClass : ''}`}
            />
          </Field>
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg mt-6 w-full">
            {isLoading ? 'Checking code…' : 'Log in'}
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={changeEmail} className="btn btn-ghost btn-sm -ml-3">
              Use a different email
            </button>
            <button type="button" onClick={handleResend} disabled={isLoading} className="btn btn-ghost btn-sm -mr-3 text-primary">
              Send a new code
            </button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
