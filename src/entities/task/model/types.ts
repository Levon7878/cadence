import type { UserSummary } from '@/entities/member/model/types';

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface TaskComment {
  id: string;
  author: UserSummary;
  body: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: UserSummary;
  estimateHours: number;
  loggedHours: number;
  dueDate?: string;
  labels: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail extends Task {
  comments: TaskComment[];
}

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger' }> = {
  backlog: { label: 'Backlog', tone: 'neutral' },
  todo: { label: 'To do', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'primary' },
  in_review: { label: 'In review', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
};

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; tone: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  urgent: { label: 'Urgent', tone: 'danger' },
};
