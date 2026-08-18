import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tokenStore } from '@/shared/api/token';
import { queryKeys } from '@/shared/api/query-keys';
import { useSessionStore } from '@/entities/session';
import { fetchMe } from '../api';

/**
 * On boot, resolves the current session from the stored token (via TanStack
 * Query) and syncs it into the session store. Server state stays owned by Query;
 * the store only mirrors the resolved identity + status for synchronous reads.
 */
export function useSessionBootstrap() {
  const hasToken = Boolean(tokenStore.get());
  const setUser = useSessionStore((s) => s.setUser);
  const setStatus = useSessionStore((s) => s.setStatus);
  const clear = useSessionStore((s) => s.clear);

  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: fetchMe,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!hasToken) {
      setStatus('unauthenticated');
      return;
    }
    if (query.isSuccess) {
      setUser(query.data);
      setStatus('authenticated');
    } else if (query.isError) {
      clear();
    }
  }, [hasToken, query.isSuccess, query.isError, query.data, setUser, setStatus, clear]);
}
