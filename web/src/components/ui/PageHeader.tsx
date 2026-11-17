import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * The one page header for every non-home page: optional back link, h1, one
 * line of context in text-muted, actions on the right (stacked under the
 * text on phones). `size="md"` is the denser admin variant.
 */
export default function PageHeader({
  title,
  description,
  back,
  actions,
  size = 'lg',
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  size?: 'lg' | 'md';
  className?: string;
}) {
  return (
    <header className={`mb-8 md:mb-10 ${className}`}>
      {back && (
        <Link
          href={back.href}
          className="-ml-2 mb-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-sm px-2 text-sm font-semibold text-muted hover:text-foreground hover:underline decoration-primary decoration-2 underline-offset-4"
        >
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0 max-w-3xl">
          <h1 className={`break-words ${size === 'lg' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>{title}</h1>
          {description && <p className="mt-3 max-w-[70ch] text-base text-muted md:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3 md:shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
