import { useMemo } from 'react';
import { can, type Permission, type ResourceContext, type Role } from '@/shared/lib/permissions';
import { useSessionStore } from '@/entities/session';
import { env } from '@/shared/config/env';
import { useDemoRoleStore } from './demo-role-store';

export interface PermissionsApi {
  role: Role | null;
  userId: string | undefined;
  can: (action: Permission, resource?: ResourceContext) => boolean;
}

/**
 * Resolves the *effective* role: the demo override (dev only) takes precedence
 * over the real session role, mirroring what the backend enforces.
 */
export function usePermissions(): PermissionsApi {
  const user = useSessionStore((s) => s.user);
  const override = useDemoRoleStore((s) => s.overrideRole);

  return useMemo(() => {
    const effectiveRole: Role | null = (env.isDev && override) || user?.role || null;
    const principal = effectiveRole ? { role: effectiveRole, id: user?.id } : null;
    return {
      role: effectiveRole,
      userId: user?.id,
      can: (action: Permission, resource?: ResourceContext) => can(principal, action, resource),
    };
  }, [user?.role, user?.id, override]);
}
