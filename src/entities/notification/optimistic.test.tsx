import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { queryKeys } from '@/shared/api/query-keys';
import { authenticate } from '@/test/utils';
import { useMarkNotification } from './api';
import type { Notification } from './model/types';

const seed: Notification[] = [
  { id: 'n1', kind: 'system', title: 'Hi', body: 'body', read: false, createdAt: new Date().toISOString() },
];

beforeEach(() => authenticate());

describe('notification read optimistic update', () => {
  it('rolls back to the previous state when the server rejects the change', async () => {
    server.use(
      http.patch('*/api/notifications/:id', async () => {
        await delay(60);
        return HttpResponse.json({ code: 'server_error', message: 'boom' }, { status: 500 });
      }),
    );

    // gcTime Infinity so the observer-less notifications cache survives for assertions.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
    });
    queryClient.setQueryData(queryKeys.notifications, seed);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMarkNotification(), { wrapper });

    act(() => {
      result.current.mutate({ id: 'n1', read: true });
    });

    // Optimistically flips to read.
    await waitFor(() => {
      expect(queryClient.getQueryData<Notification[]>(queryKeys.notifications)?.[0].read).toBe(true);
    });

    // After the failure, it rolls back to unread.
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Notification[]>(queryKeys.notifications)?.[0].read).toBe(false);
  });
});
