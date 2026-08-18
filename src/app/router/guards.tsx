import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/shared/ui';
import { useSessionStore } from '@/entities/session';
import { usePermissions } from '@/features/rbac';
import type { Permission } from '@/shared/lib/permissions';

function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner label="Loading Cadence" />
    </div>
  );
}

/** Route protection level 1: authentication. */
export function RequireAuth() {
  const status = useSessionStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Route protection level 2: authorization — sends to /403 when disallowed. */
export function RequirePermission({ action, children }: { action: Permission; children?: ReactNode }) {
  const { can } = usePermissions();
  if (!can(action)) return <Navigate to="/403" replace />;
  return <>{children ?? <Outlet />}</>;
}

/** Keep authenticated users out of the auth pages. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}
