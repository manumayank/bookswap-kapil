import { AlertTriangle, RotateCw } from 'lucide-react';
import { errorMessage } from './labels';

export default function ErrorState({
  error,
  onRetry,
  title = 'Could not load data',
  bare = false,
}: {
  error: unknown;
  onRetry: () => void;
  title?: string;
  /** Render without the card wrapper (when already inside a card). */
  bare?: boolean;
}) {
  return (
    <div role="alert" className={`${bare ? '' : 'card-flat '}p-10 text-center`}>
      <AlertTriangle size={36} className="mx-auto mb-3 text-[var(--accent)]" />
      <p className="text-lg font-bold mb-1">{title}</p>
      <p className="text-sm text-[var(--muted)] mb-5">{errorMessage(error)}</p>
      <button type="button" onClick={onRetry} className="btn btn-outline h-10 px-4 text-sm">
        <RotateCw size={16} />
        Retry
      </button>
    </div>
  );
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-[var(--accent)] mt-2">
      {errorMessage(error)}
    </p>
  );
}
