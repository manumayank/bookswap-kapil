import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'error' | 'success' | 'info';

const STYLES: Record<Tone, { box: string; icon: string }> = {
  error: { box: 'border-danger bg-accent/10', icon: 'text-danger' },
  success: { box: 'border-secondary bg-secondary/10', icon: 'text-secondary-dark' },
  info: { box: 'border-card-border bg-muted-extra-light', icon: 'text-primary' },
};

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info };

/** Message block for form-level results (server errors, confirmations). */
export default function FormAlert({
  tone = 'error',
  title,
  children,
  action,
  className = '',
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];
  const s = STYLES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-md border-2 p-4 text-sm text-foreground animate-slide-down ${s.box} ${className}`}
    >
      <Icon size={20} strokeWidth={2.25} className={`mt-px shrink-0 ${s.icon}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-muted' : 'font-medium'}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
