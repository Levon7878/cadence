import type { ReactNode } from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router/AppRouter';
import { Toaster } from '@/shared/ui';
import { useSessionBootstrap } from '@/features/auth';

function Bootstrap({ children }: { children: ReactNode }) {
  useSessionBootstrap();
  return <>{children}</>;
}

export function App() {
  return (
    <AppProviders>
      <Bootstrap>
        <AppRouter />
      </Bootstrap>
      <Toaster />
    </AppProviders>
  );
}
