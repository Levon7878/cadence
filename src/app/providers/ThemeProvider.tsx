import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { applyTheme, useThemeStore } from '@/shared/lib/stores/theme-store';

/** Applies the persisted theme and reacts to OS-level changes when in system mode. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mode]);

  return <>{children}</>;
}
