'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { InlineError } from './ErrorState';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button in the accent (red) colour. */
  tone?: 'danger' | 'default';
  /** Show an optional reason textarea; its value is passed to onConfirm. */
  withReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  isPending?: boolean;
  error?: unknown;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  pendingLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  withReason = false,
  reasonLabel = 'Reason (optional)',
  reasonPlaceholder = 'Shared with the user',
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reasonId = useId();

  // Reset reason and focus the first control whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setReason('');
    const t = window.setTimeout(() => {
      (withReason ? firstFieldRef.current : cancelRef.current)?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, withReason]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) {
        e.preventDefault();
        onCancel();
        return;
      }
      // Keep keyboard focus inside the dialog.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-premium animate-menu w-full max-w-md p-6"
      >
        <h2 id={titleId} className="mb-2 text-xl">
          {title}
        </h2>
        {message && <div className="mb-5 text-sm text-muted">{message}</div>}

        {withReason && (
          <div className="mb-4">
            <label htmlFor={reasonId} className="mb-2 block text-sm font-semibold">
              {reasonLabel}
            </label>
            <textarea
              id={reasonId}
              ref={firstFieldRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              maxLength={500}
              className="w-full resize-y"
              disabled={isPending}
            />
          </div>
        )}

        <InlineError error={error} />

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={isPending} className="btn btn-outline">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending}
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {isPending ? pendingLabel || `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
