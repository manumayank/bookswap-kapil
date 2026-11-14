'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/forms/PageHeader';
import { Field, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';
import EmptyState from '@/components/forms/EmptyState';

export default function ContactPage() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});

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
      <div className="container max-w-xl py-16 md:py-24 animate-fade-in">
        <EmptyState
          icon={CheckCircle2}
          tone="secondary"
          title="Report sent"
          actions={
            <Link href="/dashboard" className="btn btn-primary">
              Go to dashboard
            </Link>
          }
        >
          <p>The team has your report and will reply by email.</p>
          {transactionCode.trim() && (
            <p className="mt-3">
              Transaction ID: <span className="font-bold text-foreground">{transactionCode.trim()}</span>
            </p>
          )}
        </EmptyState>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!subject.trim()) next.subject = 'Add a short subject, e.g. “Seller didn’t turn up”.';
    if (!description.trim()) next.description = 'Tell us what happened so we can look into it.';
    setErrors(next);
    if (next.subject || next.description) {
      document.getElementById(next.subject ? 'contact-subject' : 'contact-description')?.focus();
      return;
    }
    submit.mutate();
  };

  return (
    <div className="container max-w-5xl py-10 md:py-14">
      <PageHeader
        back={{ href: '/dashboard', label: 'Dashboard' }}
        title="Report a problem"
        description="Something wrong with a deal, a listing or your account? Tell us and the team will look into it."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <form onSubmit={handleSubmit} noValidate className="card-flat flex flex-col gap-5 p-5 sm:p-8 animate-fade-in">
          <Field
            id="contact-txn"
            label="Transaction ID"
            optional
            hint="If it’s about a deal, copy the ID from the deal in your dashboard."
          >
            <input
              {...fieldA11y('contact-txn', { hint: true })}
              type="text"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              placeholder="SY-2026-000142"
              className={controlClass}
            />
          </Field>

          <Field id="contact-subject" label="Subject" error={errors.subject}>
            <input
              {...fieldA11y('contact-subject', { error: errors.subject })}
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="Seller didn’t turn up at the school gate"
              className={`${controlClass} ${errors.subject ? invalidClass : ''}`}
            />
          </Field>

          <Field id="contact-description" label="What happened" error={errors.description}>
            <textarea
              {...fieldA11y('contact-description', { error: errors.description })}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
              }}
              rows={6}
              placeholder="When it happened, who was involved and what you’d like us to do."
              className={`w-full resize-y ${errors.description ? invalidClass : ''}`}
            />
          </Field>

          {submit.isError && <FormAlert>We couldn’t send your report. Check your connection and try again.</FormAlert>}

          <button type="submit" disabled={submit.isPending} className="btn btn-primary btn-lg w-full sm:w-auto sm:self-start">
            <Send size={18} strokeWidth={2.5} aria-hidden />
            {submit.isPending ? 'Sending…' : 'Send report'}
          </button>
        </form>

        <aside className="card-soft p-5" aria-labelledby="contact-tips">
          <h2 id="contact-tips" className="text-lg font-bold">
            What helps us sort it quickly
          </h2>
          <ul className="mt-3 flex flex-col gap-3 text-sm text-muted">
            <li>The transaction ID, if it’s about a deal.</li>
            <li>The date and where you met, for pickup problems.</li>
            <li>What you’d like to happen next, such as a listing removed.</li>
          </ul>
          <p className="mt-4 text-sm text-muted">We reply to the email on your account.</p>
        </aside>
      </div>
    </div>
  );
}
