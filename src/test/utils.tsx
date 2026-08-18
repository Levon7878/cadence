import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { tokenStore } from '@/shared/api/token';
import { useSessionStore } from '@/entities/session';
import { useDemoRoleStore } from '@/features/rbac';
import type { Role } from '@/shared/lib/permissions';
import type { AuthUser } from '@/entities/member/model/types';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export const TEST_USER: AuthUser = {
  id: 'usr_1',
  name: 'Alex Morgan',
  email: 'alex.morgan@cadence.dev',
  role: 'owner',
  organizationId: 'org_cadence',
};

/** Authenticate the test session as `mem_1` with an optional demo-role override. */
export function authenticate(role?: Role) {
  tokenStore.set('tok_mem_1');
  useSessionStore.setState({ user: { ...TEST_USER, role: role ?? 'owner' }, status: 'authenticated' });
  useDemoRoleStore.setState({ overrideRole: role ?? null });
}

export function renderWithProviders(ui: ReactElement, options?: { route?: string; queryClient?: QueryClient }) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options?.route ?? '/']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { queryClient, ...render(ui, { wrapper }) };
}
