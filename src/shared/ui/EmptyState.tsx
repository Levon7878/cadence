import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-bg-muted text-text-subtle">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h3 className="text-md font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-base text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
