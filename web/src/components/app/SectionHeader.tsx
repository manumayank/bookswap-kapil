import type { ReactNode } from 'react';

/** Section heading with an optional count badge and a right-aligned action. */
export default function SectionHeader({
  title,
  count,
  description,
  action,
  id,
}: {
  title: string;
  count?: number;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-2 text-2xl md:text-3xl">
          {title}
          {count != null && count > 0 && <span className="badge badge-muted text-sm">{count}</span>}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
