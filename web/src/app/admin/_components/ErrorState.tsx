import UiErrorState from '@/components/ui/ErrorState';
import { errorMessage } from './labels';

/** Admin wrapper: turns an API error into the shared ErrorState's message. */
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
  return <UiErrorState title={title} message={errorMessage(error)} onRetry={onRetry} bare={bare} />;
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 text-sm font-semibold text-danger">
      {errorMessage(error)}
    </p>
  );
}
