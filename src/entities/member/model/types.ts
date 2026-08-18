import type { Role } from '@/shared/lib/permissions';

export type MemberStatus = 'active' | 'invited' | 'deactivated';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Member {
  id: string;
  user: UserSummary;
  role: Role;
  status: MemberStatus;
  title: string;
  /** Weekly capacity in hours. */
  capacity: number;
  /** Currently allocated hours across active tasks. */
  allocation: number;
  /** Derived: allocation / capacity (ratio, may exceed 1). */
  utilization: number;
  activeTaskCount: number;
  workspaceIds: string[];
  joinedAt: string;
}

export interface AuthUser extends UserSummary {
  role: Role;
  organizationId: string;
}
