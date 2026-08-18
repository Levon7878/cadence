import { AUTH_TOKEN_KEY } from '@/shared/config/constants';

/**
 * Auth token access used by the Axios interceptor. Kept as a tiny standalone
 * module (not Zustand) so interceptors can read it synchronously without a React
 * dependency. The Zustand auth store is the orchestrator that calls set/clear.
 */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {
      /* storage unavailable — token stays in-memory via the store */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};
