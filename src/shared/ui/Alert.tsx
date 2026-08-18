import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const CONFIG: Record<AlertTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-info/30 bg-info/8 text-info' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success/8 text-success' },
  warning: { icon: AlertTriangle, className: 'border-warning/30 bg-warning/10 text-warning' },
  danger: { icon: XCircle, className: 'border-danger/30 bg-danger/8 text-danger' },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = CONFIG[tone];
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-lg border p-3', toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-base text-text">
        {title && <p className="font-medium text-text">{title}</p>}
        {children && <div className="text-text-muted">{children}</div>}
      </div>
    </div>
  );
}
