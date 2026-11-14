import type { ReactNode } from 'react';

/**
 * Signed-in page header: title, one line of context, actions on the right
 * (stacked under the text on phones).
 */
export default function PageHeader({
  title,
  description,
  actions,
  size = 'lg',
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** "lg" for user pages, "md" for the denser admin area. */
  size?: 'lg' | 'md';
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={size === 'lg' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}>{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div>}
    </header>
  );
}
