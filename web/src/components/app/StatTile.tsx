import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type Tone = 'primary' | 'secondary' | 'accent' | 'muted';

const ICON_TONE: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/15 text-secondary-dark',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-muted-extra-light text-muted',
};

/**
 * Compact number tile. `attention` paints it sun yellow so the one number
 * that needs action stands out from the row; use it for at most one tile.
 */
export default function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  attention = false,
  loading = false,
  href,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  attention?: boolean;
  loading?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`text-sm font-semibold ${attention ? 'text-ink' : 'text-muted'}`}>{label}</span>
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
              attention ? 'border-2 border-ink/80 bg-card/60 text-ink' : ICON_TONE[tone]
            }`}
            aria-hidden="true"
          >
            <Icon size={16} strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div
        className={`mt-2 text-3xl font-extrabold leading-none tracking-tight ${attention ? 'text-ink' : 'text-foreground'}`}
      >
        {loading ? <span className="skeleton inline-block h-7 w-12 align-middle" /> : value}
      </div>
    </>
  );

  const base = `block rounded-lg border-2 border-edge p-4 ${attention ? 'bg-sun shadow-pop-sm' : 'bg-card'}`;

  if (href) {
    return (
      <Link href={href} className={`${base} card-interactive`}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}
