/**
 * Centralized, typed access to build-time environment configuration.
 *
 * Mocks stay on by default (dev and Vercel) until a real API is wired:
 * set `VITE_ENABLE_MOCKS=false` and `VITE_API_BASE_URL` to the backend.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  enableMocks: (import.meta.env.VITE_ENABLE_MOCKS ?? 'true') === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
