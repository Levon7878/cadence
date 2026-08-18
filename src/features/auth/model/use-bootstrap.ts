import { useEffect } from 'react';
import { DEMO_TOKEN, DEMO_USER, useSessionStore } from '@/entities/session';
import { tokenStore } from '@/shared/api/token';

/** Demo mode: keep a seeded owner session so the app never waits on login. */
export function useSessionBootstrap() {
  const setSession = useSessionStore((s) => s.setSession);

  useEffect(() => {
    if (!tokenStore.get()) tokenStore.set(DEMO_TOKEN);
    setSession(DEMO_USER, DEMO_TOKEN);
  }, [setSession]);
}
