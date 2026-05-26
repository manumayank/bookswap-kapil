'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function ContactPage() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const submit = useMutation({
    mutationFn: async () =>
      api.post('/grievances', {
        subject: subject.trim(),
        description: description.trim(),
        transactionCode: transactionCode.trim() || undefined,
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="container max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-black mb-4">Thanks — we've received your report</h1>
        <p className="text-muted">Our team has been notified and will get back to you over email. Reference: <strong>{transactionCode || '(no transaction code provided)'}</strong></p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-black mb-2">Report a problem</h1>
      <p className="text-muted mb-8">If something went wrong with a deal, listing, or your account, tell us about it. The team checks these every day.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !description.trim()) return;
          submit.mutate();
        }}
        className="card-premium p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">
            Transaction ID (optional)
          </label>
          <input
            type="text"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            placeholder="e.g. SY-2026-000142"
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
          <p className="text-[11px] text-muted mt-1">If your issue is about a specific deal, paste its transaction reference here.</p>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">Subject *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's going wrong?"
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">Description *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Tell us what happened in detail."
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
        </div>
        {submit.isError && (
          <p className="text-sm text-accent">Something went wrong sending your report. Please try again.</p>
        )}
        <button
          type="submit"
          disabled={submit.isPending || !subject.trim() || !description.trim()}
          className="btn btn-primary w-full"
        >
          {submit.isPending ? 'Sending…' : 'Send report'}
        </button>
      </form>
    </div>
  );
}
