import type { UserSummary } from '@/entities/member/model/types';

export type ActivityAction =
  | 'project.created'
  | 'project.budget_updated'
  | 'task.created'
  | 'task.status_changed'
  | 'task.reassigned'
  | 'member.invited'
  | 'member.role_changed'
  | 'invoice.paid'
  | 'settings.updated';

export type ActivityEntityType = 'project' | 'task' | 'member' | 'invoice' | 'settings';

export interface Activity {
  id: string;
  actor: UserSummary;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  projectId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}
