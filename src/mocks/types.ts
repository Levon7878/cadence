import type { Role } from '@/shared/lib/permissions';
import type { MemberStatus } from '@/entities/member/model/types';
import type { TaskPriority, TaskStatus } from '@/entities/task/model/types';
import type { ProjectStatus } from '@/entities/project/model/types';
import type { InvoiceStatus, PlanId, SubscriptionStatus } from '@/entities/billing/model/types';
import type { NotificationKind } from '@/entities/notification/model/types';
import type { ActivityAction, ActivityEntityType } from '@/entities/activity/model/types';

/**
 * Canonical (normalized) records held by the mock backend. Derived values
 * (progress, health, utilization, spent) are NOT stored — they are computed on
 * read so every screen stays consistent after a mutation.
 */
export interface RawUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface RawMember {
  id: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  title: string;
  capacity: number;
  workspaceIds: string[];
  joinedAt: string;
}

export interface RawClient {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
}

export interface RawWorkspace {
  id: string;
  name: string;
  key: string;
  clientId: string;
}

export interface RawMilestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
}

export interface RawProject {
  id: string;
  name: string;
  key: string;
  workspaceId: string;
  clientId: string;
  status: ProjectStatus;
  ownerId: string;
  memberIds: string[];
  budget: number;
  startDate: string;
  targetDate: string;
  completedDate?: string;
}

export interface RawTask {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  estimateHours: number;
  loggedHours: number;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RawComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface RawActivity {
  id: string;
  actorId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  projectId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface RawNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface RawInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
}

export interface RawSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  renewsAt: string;
}

export interface RawPaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface RawDatabase {
  organizationId: string;
  organizationName: string;
  hourlyRate: number;
  users: RawUser[];
  members: RawMember[];
  clients: RawClient[];
  workspaces: RawWorkspace[];
  projects: RawProject[];
  milestones: RawMilestone[];
  tasks: RawTask[];
  comments: RawComment[];
  activities: RawActivity[];
  notifications: RawNotification[];
  invoices: RawInvoice[];
  subscription: RawSubscription;
  paymentMethod: RawPaymentMethod;
  currentUserId: string;
}
