import { AlertOctagon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertOctagon className="size-5" aria-hidden />
      </div>
      <h3 className="text-md font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-base text-text-muted">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
