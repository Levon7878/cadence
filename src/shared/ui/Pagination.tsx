import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      className="flex items-center justify-between gap-4 px-1 py-2 text-sm text-text-muted"
      aria-label="Pagination"
    >
      <p aria-live="polite">
        {total === 0 ? 'No results' : (
          <>
            Showing <span className="font-medium text-text">{from}</span>–
            <span className="font-medium text-text">{to}</span> of{' '}
            <span className="font-medium text-text">{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 hover:bg-surface-hover',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </button>
        <span className="px-2 tabular-nums">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 hover:bg-surface-hover',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
