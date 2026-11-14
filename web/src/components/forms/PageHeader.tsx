import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Non-home page header: back link, h1, one-line description, actions on the
 * right (stacked under the text on phones).
 */
export default function PageHeader({
  title,
  description,
  back,
  actions,
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
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
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-base text-muted md:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
