/** Centralized, typed access to build-time environment configuration. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  enableMocks:
    (import.meta.env.VITE_ENABLE_MOCKS ?? String(import.meta.env.DEV)) === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
