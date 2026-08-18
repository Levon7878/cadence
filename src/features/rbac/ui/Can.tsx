import type { ReactNode } from 'react';
import type { Permission, ResourceContext } from '@/shared/lib/permissions';
import { usePermissions } from '../model/use-permissions';

/**
 * Declarative permission gate for UI affordances. Renders `children` only when
 * the effective role is allowed to perform `action`; otherwise renders
 * `fallback` (default: nothing).
 */
export function Can({
  action,
  resource,
  children,
  fallback = null,
}: {
  action: Permission;
  resource?: ResourceContext;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermissions();
  return <>{can(action, resource) ? children : fallback}</>;
}
