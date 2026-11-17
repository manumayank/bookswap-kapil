import type { ReactNode } from 'react';
import Link from 'next/link';
import Wordmark from '@/components/brand/Wordmark';

/** Centred auth layout: logo, outlined card with the pencil stripe, footer links. */
export default function AuthCard({
  title,
  description,
  children,
  footer,
  width = 'max-w-[440px]',
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <div className="container flex justify-center py-10 md:py-16">
      <div className={`w-full ${width} animate-fade-in`}>
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Sybrary home" className="inline-flex">
            <Wordmark height={48} />
          </Link>
        </div>

        <div className="card-premium overflow-hidden">
          <div className="pencil-stripe" aria-hidden />
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl">{title}</h1>
            {description && <div className="mt-2 text-muted">{description}</div>}
            <div className="mt-7">{children}</div>
          </div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}

export const textLinkClass =
  'font-bold text-primary underline decoration-primary/40 decoration-2 underline-offset-4 hover:decoration-primary';
