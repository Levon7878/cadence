/**
 * Centralized, typed access to build-time environment configuration.
 *
 * There is no real backend yet. Mocks stay on unless explicitly disabled
 * with VITE_ENABLE_MOCKS=false (empty/unset counts as on — needed on Vercel).
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
