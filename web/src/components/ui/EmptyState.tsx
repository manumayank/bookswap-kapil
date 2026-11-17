import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const TILE = {
  sun: 'bg-sun text-ink',
  secondary: 'bg-secondary text-ink',
  primary: 'bg-primary text-on-primary',
  muted: 'bg-muted-extra-light text-foreground',
} as const;

/**
 * The one empty / result state: centred icon tile, title, a line or two, and
 * the next action.
 * - size "lg" (default): the page's whole content (log-in gates, confirmations).
 * - size "md": inside a section or table card (dashboard lists, admin tables).
 * `bare` drops the card outline when it already sits inside a card.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  actions,
  tone,
  size = 'lg',
  bare = false,
  className = '',
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: keyof typeof TILE;
  size?: 'lg' | 'md';
  bare?: boolean;
  className?: string;
}) {
  const lg = size === 'lg';
  const tile = TILE[tone ?? (lg ? 'sun' : 'muted')];
  const body = description ?? children;
  return (
    <div
      className={`${bare ? '' : 'card-flat '}text-center ${lg ? 'px-6 py-12 md:px-10 md:py-16' : 'px-6 py-10'} ${className}`}
    >
      {Icon && (
        <div
          className={`mx-auto flex -rotate-3 items-center justify-center rounded-md border-2 border-edge shadow-pop-sm ${tile} ${
            lg ? 'mb-6 h-16 w-16' : 'mb-4 h-14 w-14'
          }`}
          aria-hidden
        >
          <Icon size={lg ? 30 : 26} strokeWidth={2.25} />
        </div>
      )}
      {lg ? <h2 className="text-2xl md:text-3xl">{title}</h2> : <p className="text-lg font-bold">{title}</p>}
      {body && <div className={`mx-auto text-muted ${lg ? 'mt-3 max-w-md' : 'mt-1 max-w-[52ch] text-sm'}`}>{body}</div>}
      {actions && (
        <div
          className={`flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center ${lg ? 'mt-8' : 'mt-5'}`}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
