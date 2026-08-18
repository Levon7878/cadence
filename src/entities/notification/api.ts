import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Notification } from './model/types';

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get('/notifications');
  return data as Notification[];
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
    staleTime: 15_000,
  });
}

/** Optimistic read-state toggle with rollback on failure. */
export function useMarkNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => apiClient.patch(`/notifications/${id}`, { read }),
    onMutate: async ({ id, read }) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = qc.getQueryData<Notification[]>(queryKeys.notifications);
      qc.setQueryData<Notification[]>(queryKeys.notifications, (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read } : n)),
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.notifications, context.previous);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = qc.getQueryData<Notification[]>(queryKeys.notifications);
      qc.setQueryData<Notification[]>(queryKeys.notifications, (prev) => prev?.map((n) => ({ ...n, read: true })));
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.notifications, context.previous);
    },
  });
}
