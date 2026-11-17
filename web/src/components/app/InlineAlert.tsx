import { AlertCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

/** Dismissible error banner for failed actions. */
export default function InlineAlert({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-md border-2 border-danger bg-accent/10 p-3 pl-4 text-sm font-semibold text-danger"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1 pt-px">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-my-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm hover:bg-accent/10"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
