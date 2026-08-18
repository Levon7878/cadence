import type { UserSummary } from '@/entities/member/model/types';

export const PROJECT_STATUSES = ['planning', 'active', 'at_risk', 'on_hold', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_HEALTHS = ['on_track', 'at_risk', 'off_track'] as const;
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number];

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue';
  /** Derived from tasks assigned to this milestone. */
  progress: number;
  taskCount: number;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  workspaceId: string;
  clientId?: string;
  status: ProjectStatus;
  /** Derived from deadlines, budget burn, blocked tasks and progress. */
  health: ProjectHealth;
  owner: UserSummary;
  memberIds: string[];
  budget: number;
  spent: number;
  /** Derived: done tasks / total tasks (0–100). */
  progress: number;
  taskCount: number;
  openTaskCount: number;
  blockedTaskCount: number;
  startDate: string;
  targetDate: string;
  completedDate?: string;
}

export interface ProjectDetail extends Project {
  milestones: Milestone[];
  /** Ordered list of factors that determined the health rating. */
  healthReasons: string[];
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: 'neutral' | 'info' | 'primary' | 'warning' | 'danger' | 'success' }> = {
  planning: { label: 'Planning', tone: 'info' },
  active: { label: 'Active', tone: 'primary' },
  at_risk: { label: 'At risk', tone: 'warning' },
  on_hold: { label: 'On hold', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const PROJECT_HEALTH_META: Record<ProjectHealth, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  on_track: { label: 'On track', tone: 'success' },
  at_risk: { label: 'At risk', tone: 'warning' },
  off_track: { label: 'Off track', tone: 'danger' },
};
