import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Centred empty / result panel: icon tile, heading, one or two lines, actions. */
export default function EmptyState({
  icon: Icon,
  title,
  children,
  actions,
  tone = 'sun',
  className = '',
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: 'sun' | 'secondary' | 'primary';
  className?: string;
}) {
  const tile =
    tone === 'secondary' ? 'bg-secondary text-ink' : tone === 'primary' ? 'bg-primary text-on-primary' : 'bg-sun text-ink';
  return (
    <div className={`card-flat px-6 py-12 text-center md:px-10 md:py-16 ${className}`}>
      <div
        className={`mx-auto mb-6 flex h-16 w-16 -rotate-3 items-center justify-center rounded-md border-2 border-edge shadow-pop-sm ${tile}`}
        aria-hidden
      >
        <Icon size={30} strokeWidth={2.25} />
      </div>
      <h2 className="text-2xl md:text-3xl">{title}</h2>
      {children && <div className="mx-auto mt-3 max-w-md text-muted">{children}</div>}
      {actions && <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">{actions}</div>}
    </div>
  );
}
