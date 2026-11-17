import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * The one "couldn't load" state: same shape as EmptyState (centred icon tile,
 * title, what happened, one retry action) so failures look the same everywhere.
 * size "lg" when it replaces the page's main content, "md" inside a section.
 */
export default function ErrorState({
  title = 'Couldn’t load this',
  message = 'Check your connection and try again.',
  onRetry,
  size = 'md',
  bare = false,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  size?: 'lg' | 'md';
  bare?: boolean;
}) {
  const lg = size === 'lg';
  return (
    <div role="alert" className={`${bare ? '' : 'card-flat '}text-center ${lg ? 'px-6 py-12 md:py-16' : 'px-6 py-10'}`}>
      <div
        className={`mx-auto flex items-center justify-center rounded-md border-2 border-danger bg-accent/10 text-danger ${
          lg ? 'mb-6 h-16 w-16' : 'mb-4 h-14 w-14'
        }`}
        aria-hidden
      >
        <AlertTriangle size={lg ? 30 : 26} strokeWidth={2.25} />
      </div>
      {lg ? <h2 className="text-2xl md:text-3xl">{title}</h2> : <p className="text-lg font-bold">{title}</p>}
      {message && <p className={`mx-auto text-muted ${lg ? 'mt-3 max-w-md' : 'mt-1 max-w-[52ch] text-sm'}`}>{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={`btn btn-outline ${lg ? 'mt-8' : 'btn-sm mt-5'}`}>
          <RotateCw size={16} strokeWidth={2.25} aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
