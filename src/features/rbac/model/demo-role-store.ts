import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { requestContext } from '@/shared/api/request-context';
import type { Role } from '@/shared/lib/permissions';

interface DemoRoleState {
  /** When set, overrides the real session role across the UI *and* outgoing
   *  requests (via X-Demo-Role), so the mock backend enforces this role too. */
  overrideRole: Role | null;
  setOverrideRole: (role: Role | null) => void;
}

export const useDemoRoleStore = create<DemoRoleState>()(
  persist(
    (set) => ({
      overrideRole: null,
      setOverrideRole: (role) => {
        requestContext.setDemoRole(role);
        set({ overrideRole: role });
      },
    }),
    {
      name: 'cadence.demo-role',
      onRehydrateStorage: () => (state) => {
        // Keep the Axios request context in sync after hydration.
        requestContext.setDemoRole(state?.overrideRole ?? null);
      },
    },
  ),
);
