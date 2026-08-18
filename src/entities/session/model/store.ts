import { create } from 'zustand';
import { tokenStore } from '@/shared/api/token';
import type { AuthUser } from '@/entities/member/model/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: AuthUser | null;
  status: SessionStatus;
  setSession: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: SessionStatus) => void;
  clear: () => void;
}

/**
 * Auth/session client state. Server data (the canonical user) is fetched via
 * TanStack Query on boot; this store holds the resolved identity + status that
 * many parts of the app read synchronously (guards, permissions, app shell).
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  setSession: (user, token) => {
    tokenStore.set(token);
    set({ user, status: 'authenticated' });
  },
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => {
    tokenStore.clear();
    set({ user: null, status: 'unauthenticated' });
  },
}));
