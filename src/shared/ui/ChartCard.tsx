import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { ErrorState } from './ErrorState';

/**
 * Wraps a chart with a title and — crucially — an accessible text summary so
 * screen-reader users get the same information the visualization conveys.
 */
export function ChartCard({
  title,
  description,
  summary,
  action,
  loading,
  error,
  onRetry,
  height = 240,
  className,
  children,
}: {
  title: string;
  description?: string;
  /** Plain-language description of the data, announced to assistive tech. */
  summary: string;
  action?: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  height?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="min-w-0">
          <h3 className="text-md font-semibold text-text">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="min-w-0 overflow-hidden p-4 pt-3" style={{ height }}>
        {loading ? (
          <Skeleton className="size-full" />
        ) : error ? (
          <ErrorState onRetry={onRetry} description="Failed to load chart data." />
        ) : (
          <figure className="size-full">
            <figcaption className="sr-only">{summary}</figcaption>
            <div aria-hidden className="size-full">
              {children}
            </div>
          </figure>
        )}
      </div>
    </Card>
  );
}
