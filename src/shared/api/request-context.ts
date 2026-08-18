/**
 * Cross-cutting request context read by the Axios interceptor but owned by
 * higher layers. Keeps `shared` free of feature imports while letting the dev
 * role switcher influence outgoing requests (so the mock backend enforces the
 * *effective* role, returning real 403s).
 */
let demoRole: string | null = null;

export const requestContext = {
  getDemoRole: (): string | null => demoRole,
  setDemoRole: (role: string | null): void => {
    demoRole = role;
  },
};
