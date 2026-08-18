import { create } from 'zustand';
import { tokenStore } from '@/shared/api/token';
import type { AuthUser } from '@/entities/member/model/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export const DEMO_USER: AuthUser = {
  id: 'usr_1',
  name: 'Alex Morgan',
  email: 'alex.morgan@cadence.dev',
  role: 'owner',
  organizationId: 'org_cadence',
};

export const DEMO_TOKEN = 'tok_mem_1';

tokenStore.set(DEMO_TOKEN);

interface SessionState {
  user: AuthUser | null;
  status: SessionStatus;
  setSession: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: SessionStatus) => void;
  clear: () => void;
}

/**
 * Auth/session client state. Login is skipped for this demo: the app boots as
 * the seeded owner so Vercel (and local) never depend on POST /auth/login.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: DEMO_USER,
  status: 'authenticated',
  setSession: (user, token) => {
    tokenStore.set(token);
    set({ user, status: 'authenticated' });
  },
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => {
    tokenStore.set(DEMO_TOKEN);
    set({ user: DEMO_USER, status: 'authenticated' });
  },
}));
