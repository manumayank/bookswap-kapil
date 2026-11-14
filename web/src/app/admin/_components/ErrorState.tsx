import { AlertTriangle, RotateCw } from 'lucide-react';
import { errorMessage } from './labels';

export default function ErrorState({
  error,
  onRetry,
  title = 'Couldn’t load this data',
  bare = false,
}: {
  error: unknown;
  onRetry: () => void;
  title?: string;
  /** Render without the card wrapper (when already inside a card). */
  bare?: boolean;
}) {
  return (
    <div role="alert" className={`${bare ? '' : 'card-flat '}px-6 py-10 text-center`}>
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border-2 border-accent bg-accent/10 text-accent">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <p className="text-lg font-bold">{title}</p>
      <p className="mx-auto mb-5 mt-1 max-w-[52ch] text-sm text-muted">{errorMessage(error)}</p>
      <button type="button" onClick={onRetry} className="btn btn-outline btn-sm">
        <RotateCw size={16} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-semibold text-accent">
      {errorMessage(error)}
    </p>
  );
}
