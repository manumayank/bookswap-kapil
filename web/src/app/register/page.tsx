'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { BOARD_OPTIONS, boardLabel } from '@/lib/labels';
import AuthCard, { textLinkClass } from '@/components/forms/AuthCard';
import { Field, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';
import SchoolSuggestions, { type SchoolOption } from '@/components/forms/SchoolSuggestions';

type FieldName = 'name' | 'email' | 'phone' | 'city';
type Errors = Partial<Record<FieldName, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, verifiedEmail } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    board: '',
    schoolId: '',
  });
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [searchingSchools, setSearchingSchools] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Prefill the email that was just verified on the login page
  useEffect(() => {
    if (verifiedEmail) setForm((prev) => (prev.email ? prev : { ...prev, email: verifiedEmail }));
  }, [verifiedEmail]);

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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as FieldName]) setErrors((prev) => ({ ...prev, [name]: undefined }));

    // A different city or board invalidates the chosen school
    if (name === 'city' || name === 'board') {
      setForm((prev) => ({ ...prev, schoolId: '' }));
      setSchoolSearch('');
      setSelectedSchoolName('');
      setSchools([]);
    }
  };

  const handleSchoolSelect = (school: SchoolOption) => {
    setForm((prev) => ({ ...prev, schoolId: school.id }));
    setSchoolSearch(school.name);
    setSelectedSchoolName(school.name);
    setShowSchoolDropdown(false);
    setSchools([]);
  };

  const handleSchoolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolSearch(e.target.value);
    setSelectedSchoolName('');
    setForm((prev) => ({ ...prev, schoolId: '' }));
    setShowSchoolDropdown(true);
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.name || form.name.length < 2) next.name = 'Enter your full name.';
    if (!form.email || !form.email.includes('@')) next.email = 'Enter an email address like name@example.com.';
    if (!form.phone || form.phone.length < 10) next.phone = 'Enter a 10-digit mobile number.';
    if (!form.city || form.city.length < 2) next.city = 'Enter the city you live in.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const next = validate();
    setErrors(next);
    const first = (Object.keys(next) as FieldName[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`#${first}`)?.focus();
      return;
    }

    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setFormError(err.response?.data?.error || "We couldn't create your account. Check your details and try again.");
    }
  };

  const err = (n: FieldName) => (errors[n] ? invalidClass : '');

  return (
    <AuthCard
      width="max-w-[480px]"
      title="Set up your account"
      description={<p>A few details so we can show you books from schools near you.</p>}
      footer={
        <>
          <p>
            Already have an account?{' '}
            <Link href="/login" className={textLinkClass}>
              Log in
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

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field id="name" label="Full name" error={errors.name}>
          <input
            {...fieldA11y('name', { error: errors.name })}
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Priya Sharma"
            autoFocus
            className={`${controlClass} ${err('name')}`}
          />
        </Field>

        <Field id="email" label="Email address" error={errors.email}>
          <input
            {...fieldA11y('email', { error: errors.email })}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`${controlClass} ${err('email')}`}
          />
        </Field>

        <Field
          id="phone"
          label="Mobile number"
          error={errors.phone}
          hint={
            <span className="inline-flex items-start gap-1.5">
              <Lock size={14} strokeWidth={2.5} className="mt-[3px] shrink-0" aria-hidden />
              Buyers and sellers only see it after you accept a deal.
            </span>
          }
        >
          <input
            {...fieldA11y('phone', { error: errors.phone, hint: true })}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="98765 43210"
            className={`${controlClass} ${err('phone')}`}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="city" label="City" error={errors.city}>
            <input
              {...fieldA11y('city', { error: errors.city })}
              name="city"
              type="text"
              autoComplete="address-level2"
              value={form.city}
              onChange={handleChange}
              placeholder="Bengaluru"
              className={`${controlClass} ${err('city')}`}
            />
          </Field>

          <Field id="board" label="School board" optional>
            <select id="board" name="board" value={form.board} onChange={handleChange} className={controlClass}>
              <option value="">Choose a board</option>
              {BOARD_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {boardLabel(b)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          id="school"
          label="Your child’s school"
          optional
          hint={!form.city ? 'Add your city first to search schools.' : selectedSchoolName ? undefined : 'Type at least 2 letters.'}
        >
          <div className="relative">
            <input
              {...fieldA11y('school', { hint: true })}
              type="text"
              role="combobox"
              aria-expanded={showSchoolDropdown && schoolSearch.length >= 2}
              aria-controls="school-suggestions"
              aria-autocomplete="list"
              autoComplete="off"
              value={schoolSearch}
              onChange={handleSchoolInputChange}
              onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
              onKeyDown={(e) => e.key === 'Escape' && setShowSchoolDropdown(false)}
              placeholder={form.city ? 'Search by school name' : 'Add your city first'}
              disabled={!form.city}
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
              listId="school-suggestions"
              open={showSchoolDropdown && schoolSearch.length >= 2 && !searchingSchools}
              schools={schools}
              onSelect={handleSchoolSelect}
              empty="No school by that name yet. You can skip this and add it later."
            />
          </div>
        </Field>

        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg mt-2 w-full">
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
