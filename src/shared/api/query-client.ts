import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Don't retry auth/permission/not-found errors; retry transient ones once.
          if (isApiError(error) && [401, 403, 404, 422].includes(error.status)) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
