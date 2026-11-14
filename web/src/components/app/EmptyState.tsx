import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Centred empty state that invites the next action. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Render without the card outline (when already inside a card). */
  bare?: boolean;
}) {
  return (
    <div className={`${bare ? '' : 'card-flat '}px-6 py-12 text-center`}>
      {Icon && (
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-edge bg-muted-extra-light text-foreground">
          <Icon size={26} strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}
      <p className="text-lg font-bold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-[52ch] text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
