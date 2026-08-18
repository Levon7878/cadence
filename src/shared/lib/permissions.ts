/**
 * Centralized RBAC policy. This is the single source of truth for authorization
 * decisions on the frontend. Never scatter `role === 'admin'` through components —
 * always ask `can(...)` (via `usePermissions()` / `<Can>`).
 *
 * NOTE: Frontend RBAC is a UX + defense-in-depth boundary. Real authorization is
 * re-enforced by the (mock) backend, which returns genuine 403s for disallowed
 * mutations regardless of what the UI shows.
 */

export const ROLES = ['owner', 'admin', 'manager', 'member', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<Role, { label: string; description: string; rank: number }> = {
  owner: { label: 'Owner', description: 'Full control including billing and org deletion.', rank: 5 },
  admin: { label: 'Admin', description: 'Manage members, projects, and settings.', rank: 4 },
  manager: { label: 'Manager', description: 'Run delivery: projects, tasks, and analytics.', rank: 3 },
  member: { label: 'Member', description: 'Work on assigned tasks and projects.', rank: 2 },
  viewer: { label: 'Viewer', description: 'Read-only access across the workspace.', rank: 1 },
};

export type Permission =
  | 'project:view'
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'task:view'
  | 'task:create'
  | 'task:edit'
  | 'task:assign'
  | 'task:delete'
  | 'member:view'
  | 'member:invite'
  | 'member:edit'
  | 'member:deactivate'
  | 'role:assign'
  | 'analytics:view'
  | 'analytics:export'
  | 'billing:view'
  | 'billing:manage'
  | 'settings:view'
  | 'settings:organization'
  | 'settings:permissions';

const VIEWER: Permission[] = ['project:view', 'task:view', 'member:view', 'analytics:view', 'settings:view'];

const MEMBER: Permission[] = [...VIEWER, 'task:create', 'task:edit', 'task:assign'];

const MANAGER: Permission[] = [
  ...MEMBER,
  'project:create',
  'project:edit',
  'task:delete',
  'analytics:export',
];

const ADMIN: Permission[] = [
  ...MANAGER,
  'project:delete',
  'member:invite',
  'member:edit',
  'member:deactivate',
  'role:assign',
  'billing:view',
  'settings:organization',
  'settings:permissions',
];

const OWNER: Permission[] = [...ADMIN, 'billing:manage'];

const POLICY: Record<Role, ReadonlySet<Permission>> = {
  viewer: new Set(VIEWER),
  member: new Set(MEMBER),
  manager: new Set(MANAGER),
  admin: new Set(ADMIN),
  owner: new Set(OWNER),
};

export interface Principal {
  role: Role;
  id?: string;
}

export interface ResourceContext {
  /** Owner/assignee of the resource, to allow "own-resource" checks. */
  ownerId?: string;
}

/**
 * Authorization check. `resource` enables ownership-aware rules:
 * a Member may edit/assign a task only if they own it, but Managers+ may edit any.
 */
export function can(
  principal: Principal | null | undefined,
  action: Permission,
  resource?: ResourceContext,
): boolean {
  if (!principal) return false;
  const granted = POLICY[principal.role];
  if (!granted?.has(action)) return false;

  const ownershipScoped: Permission[] = ['task:edit', 'task:assign'];
  if (
    principal.role === 'member' &&
    ownershipScoped.includes(action) &&
    resource?.ownerId != null
  ) {
    return resource.ownerId === principal.id;
  }
  return true;
}

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_META[role].rank >= ROLE_META[min].rank;
}

/** Permissions data used to render the read-only role matrix in settings. */
export const ALL_PERMISSIONS: Permission[] = [
  'project:view', 'project:create', 'project:edit', 'project:delete',
  'task:view', 'task:create', 'task:edit', 'task:assign', 'task:delete',
  'member:view', 'member:invite', 'member:edit', 'member:deactivate', 'role:assign',
  'analytics:view', 'analytics:export',
  'billing:view', 'billing:manage',
  'settings:view', 'settings:organization', 'settings:permissions',
];

export function roleHas(role: Role, permission: Permission): boolean {
  return POLICY[role].has(permission);
}
