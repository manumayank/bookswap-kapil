import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

type FieldProps = {
  /** id of the control inside; the label points at it */
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Label + control + hint + inline error.
 * Pair the control with `fieldA11y(id, { hint, error })` so it gets
 * aria-describedby / aria-invalid wired to the texts rendered here.
 */
export function Field({ id, label, hint, error, optional, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-foreground">
        {label}
        {optional && <span className="text-[13px] font-normal text-muted">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-[13px] leading-snug text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-accent">
      <AlertCircle size={16} strokeWidth={2.5} className="mt-[3px] shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

/** aria props for a control rendered inside <Field>. */
export function fieldA11y(id: string, opts: { hint?: unknown; error?: string } = {}) {
  const describedBy = opts.error ? `${id}-error` : opts.hint ? `${id}-hint` : undefined;
  return {
    id,
    'aria-invalid': opts.error ? true : undefined,
    'aria-describedby': describedBy,
  } as const;
}

/** Shared class for full-width inputs/selects in forms (styling itself is global). */
export const controlClass = 'w-full min-h-[48px]';
export const invalidClass = '!border-accent';
