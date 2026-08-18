import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * URL is the source of truth for shareable/restorable view state (filters,
 * search, pagination, sort, analytics range). This hook provides typed helpers
 * over `useSearchParams` while keeping the URL clean (default values are removed).
 */
export function useUrlState() {
  const [params, setParams] = useSearchParams();

  const get = useCallback(
    (key: string, fallback = ''): string => params.get(key) ?? fallback,
    [params],
  );

  const getNumber = useCallback(
    (key: string, fallback: number): number => {
      const raw = params.get(key);
      const parsed = raw == null ? NaN : Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    [params],
  );

  const set = useCallback(
    (updates: Record<string, string | number | undefined | null>, options?: { resetPage?: boolean }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          if (options?.resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return useMemo(() => ({ params, get, getNumber, set }), [params, get, getNumber, set]);
}
