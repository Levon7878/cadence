import { cn } from '@/shared/lib/cn';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';

const TONES: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function Progress({
  value,
  tone = 'primary',
  className,
  label,
}: {
  /** 0–100 */
  value: number;
  tone?: ProgressTone;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-muted', className)}
    >
      <div className={cn('h-full rounded-full transition-all', TONES[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
