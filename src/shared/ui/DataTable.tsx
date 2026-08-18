import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Rows2, Rows3 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { SortDirection } from '@/shared/types/api';
import { Checkbox } from './Checkbox';
import { Popover } from './Popover';
import { IconButton } from './IconButton';
import { Skeleton } from './Skeleton';
import { ErrorState } from './ErrorState';

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="menu"], [role="menuitem"]';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
  hideable?: boolean;
  /** Label used in the mobile card fallback; defaults to `header`. */
  mobileLabel?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  sort?: { id: string; dir: SortDirection };
  onSortChange?: (id: string) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[]) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  sort,
  onSortChange,
  selectable,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  onRowClick,
  emptyState,
  caption,
}: DataTableProps<T>) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [dense, setDense] = useState(false);

  const visibleColumns = useMemo(() => columns.filter((c) => !hidden.has(c.id)), [columns, hidden]);
  const selected = new Set(selectedIds);
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(getRowId(r)));
  const someSelected = rows.some((r) => selected.has(getRowId(r)));

  const toggleAll = () =>
    onSelectionChange?.(allSelected ? [] : rows.map(getRowId));
  const toggleRow = (id: string) =>
    onSelectionChange?.(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const cellPad = dense ? 'px-3 py-1.5' : 'px-3 py-2.5';

  const handleRowActivate = (event: MouseEvent | KeyboardEvent, row: T) => {
    if (!onRowClick) return;
    if ((event.target as HTMLElement | null)?.closest?.(INTERACTIVE_SELECTOR)) return;
    if ('key' in event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
    }
    onRowClick(row);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div aria-live="polite" className="text-sm text-text-muted">
          {selectable && someSelected ? (
            <span className="flex items-center gap-3">
              <span className="font-medium text-text">{selected.size} selected</span>
              {bulkActions?.(selectedIds)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label={dense ? 'Comfortable rows' : 'Compact rows'}
            size="sm"
            onClick={() => setDense((v) => !v)}
          >
            {dense ? <Rows3 className="size-4" /> : <Rows2 className="size-4" />}
          </IconButton>
          <Popover
            align="end"
            trigger={(p) => (
              <IconButton label="Toggle columns" size="sm" {...p}>
                <Columns3 className="size-4" />
              </IconButton>
            )}
          >
            {() => (
              <div className="flex w-44 flex-col gap-1.5">
                <p className="px-1 text-sm font-medium text-text">Columns</p>
                {columns.filter((c) => c.hideable !== false).map((c) => (
                  <Checkbox
                    key={c.id}
                    label={c.header}
                    checked={!hidden.has(c.id)}
                    onChange={() =>
                      setHidden((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.id)) next.delete(c.id);
                        else next.add(c.id);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            )}
          </Popover>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full border-collapse text-base">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10 bg-bg-subtle">
            <tr className="border-b border-border">
              {selectable && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <Checkbox
                    aria-label="Select all rows"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const isSorted = sort?.id === col.id;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn('px-3 py-2.5 text-left text-sm font-semibold text-text-muted', col.align === 'right' && 'text-right')}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(col.id)}
                        className={cn('inline-flex items-center gap-1 hover:text-text', col.align === 'right' && 'flex-row-reverse')}
                      >
                        {col.header}
                        {isSorted ? (
                          sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {selectable && <td className={cellPad}><Skeleton className="size-4" /></td>}
                  {visibleColumns.map((col) => (
                    <td key={col.id} className={cellPad}><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
            {!loading && !error &&
              rows.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? (event) => handleRowActivate(event, row) : undefined}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-surface-hover',
                      selected.has(id) && 'bg-primary/5',
                    )}
                  >
                    {selectable && (
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label="Select row"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(cellPad, 'text-text align-middle', col.align === 'right' && 'text-right', col.className)}
                        onClick={col.header ? undefined : (event) => event.stopPropagation()}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
        {!loading && error && <ErrorState onRetry={onRetry} description="Failed to load data." />}
        {!loading && !error && rows.length === 0 && (emptyState ?? <DefaultEmpty />)}
      </div>

      {/* Mobile card fallback */}
      <div className="flex flex-col gap-2 md:hidden">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        {!loading && error && (
          <div className="rounded-lg border border-border"><ErrorState onRetry={onRetry} description="Failed to load data." /></div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-border">{emptyState ?? <DefaultEmpty />}</div>
        )}
        {!loading && !error &&
          rows.map((row) => {
            const id = getRowId(row);
            return (
              <div
                key={id}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? (event) => handleRowActivate(event, row) : undefined}
                onKeyDown={onRowClick ? (event) => handleRowActivate(event, row) : undefined}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {visibleColumns.map((col) =>
                  col.header ? (
                    <div key={col.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-text-muted">{col.mobileLabel ?? col.header}</span>
                      <span className="text-base text-text">{col.cell(row)}</span>
                    </div>
                  ) : (
                    <div key={col.id} className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                      {col.cell(row)}
                    </div>
                  ),
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function DefaultEmpty() {
  return <div className="px-6 py-12 text-center text-base text-text-muted">No results found.</div>;
}
