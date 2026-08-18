import type { UserSummary, Member } from '@/entities/member/model/types';
import type { Task, TaskDetail } from '@/entities/task/model/types';
import type { Project, ProjectDetail, Milestone, ProjectHealth } from '@/entities/project/model/types';
import type { RawDatabase, RawProject, RawMember, RawTask, RawMilestone } from './types';

const DAY = 86_400_000;
const ACTIVE_TASK_STATUSES = new Set(['todo', 'in_progress', 'in_review', 'blocked']);

export function userSummary(db: RawDatabase, userId: string): UserSummary {
  const user = db.users.find((u) => u.id === userId);
  return user
    ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
    : { id: userId, name: 'Unknown', email: '' };
}

export function memberUserSummary(db: RawDatabase, memberId: string): UserSummary | undefined {
  const member = db.members.find((m) => m.id === memberId);
  return member ? userSummary(db, member.userId) : undefined;
}

export function deriveTask(db: RawDatabase, raw: RawTask): Task {
  return {
    id: raw.id,
    projectId: raw.projectId,
    milestoneId: raw.milestoneId,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    assignee: raw.assigneeId ? memberUserSummary(db, raw.assigneeId) : undefined,
    estimateHours: raw.estimateHours,
    loggedHours: raw.loggedHours,
    dueDate: raw.dueDate,
    labels: raw.labels,
    commentCount: db.comments.filter((c) => c.taskId === raw.id).length,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function deriveTaskDetail(db: RawDatabase, raw: RawTask): TaskDetail {
  return {
    ...deriveTask(db, raw),
    comments: db.comments
      .filter((c) => c.taskId === raw.id)
      .map((c) => ({ id: c.id, author: userSummary(db, c.authorId), body: c.body, createdAt: c.createdAt }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export function deriveMember(db: RawDatabase, raw: RawMember): Member {
  const assignedTasks = db.tasks.filter((t) => t.assigneeId === raw.id);
  const activeTasks = assignedTasks.filter((t) => ACTIVE_TASK_STATUSES.has(t.status));
  const allocation = activeTasks.reduce((sum, t) => sum + t.estimateHours, 0);
  return {
    id: raw.id,
    user: userSummary(db, raw.userId),
    role: raw.role,
    status: raw.status,
    title: raw.title,
    capacity: raw.capacity,
    allocation,
    utilization: raw.capacity > 0 ? allocation / raw.capacity : 0,
    activeTaskCount: activeTasks.length,
    workspaceIds: raw.workspaceIds,
    joinedAt: raw.joinedAt,
  };
}

interface HealthResult {
  health: ProjectHealth;
  reasons: string[];
  progress: number;
  spent: number;
  taskCount: number;
  openTaskCount: number;
  blockedTaskCount: number;
}

export function computeProjectHealth(db: RawDatabase, raw: RawProject): HealthResult {
  const tasks = db.tasks.filter((t) => t.projectId === raw.id);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const spent = tasks.reduce((sum, t) => sum + t.loggedHours, 0) * db.hourlyRate;

  const reasons: string[] = [];
  let risk = 0;

  if (raw.status === 'completed') {
    return { health: 'on_track', reasons: ['Project delivered'], progress: 100, spent, taskCount: total, openTaskCount: 0, blockedTaskCount: blocked };
  }

  const now = Date.now();
  const target = new Date(raw.targetDate).getTime();
  const start = new Date(raw.startDate).getTime();
  const overdueDays = Math.round((now - target) / DAY);

  if (overdueDays > 0 && progress < 100) {
    risk += overdueDays > 14 ? 3 : 2;
    reasons.push(`Behind schedule by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`);
  } else {
    const elapsed = Math.min(1, Math.max(0, (now - start) / (target - start || 1)));
    const expected = Math.round(elapsed * 100);
    if (progress < expected - 15) {
      risk += 2;
      reasons.push(`Progress (${progress}%) trailing plan (${expected}%)`);
    }
  }

  const burn = raw.budget > 0 ? spent / raw.budget : 0;
  if (burn > 0.9 && progress < 90) {
    risk += 2;
    reasons.push(`Budget ${Math.round(burn * 100)}% spent at ${progress}% progress`);
  } else if (burn > progress / 100 + 0.15) {
    risk += 1;
    reasons.push('Budget burn ahead of progress');
  }

  if (blocked >= 3) {
    risk += 2;
    reasons.push(`${blocked} blocked tasks`);
  } else if (blocked >= 1) {
    risk += 1;
    reasons.push(`${blocked} blocked task${blocked === 1 ? '' : 's'}`);
  }

  if (reasons.length === 0) reasons.push('On plan across schedule, budget and workload');

  const health: ProjectHealth = risk >= 4 ? 'off_track' : risk >= 2 ? 'at_risk' : 'on_track';
  return { health, reasons, progress, spent, taskCount: total, openTaskCount: total - done, blockedTaskCount: blocked };
}

export function deriveProject(db: RawDatabase, raw: RawProject): Project {
  const h = computeProjectHealth(db, raw);
  return {
    id: raw.id,
    name: raw.name,
    key: raw.key,
    workspaceId: raw.workspaceId,
    clientId: raw.clientId,
    status: raw.status,
    health: h.health,
    owner: userSummary(db, db.members.find((m) => m.id === raw.ownerId)?.userId ?? ''),
    memberIds: raw.memberIds,
    budget: raw.budget,
    spent: h.spent,
    progress: h.progress,
    taskCount: h.taskCount,
    openTaskCount: h.openTaskCount,
    blockedTaskCount: h.blockedTaskCount,
    startDate: raw.startDate,
    targetDate: raw.targetDate,
    completedDate: raw.completedDate,
  };
}

export function deriveMilestone(db: RawDatabase, raw: RawMilestone): Milestone {
  const tasks = db.tasks.filter((t) => t.milestoneId === raw.id);
  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const overdue = Date.now() > new Date(raw.dueDate).getTime();
  const status: Milestone['status'] =
    tasks.length > 0 && done === tasks.length
      ? 'completed'
      : overdue
        ? 'overdue'
        : tasks.some((t) => t.status === 'in_progress')
          ? 'in_progress'
          : 'upcoming';
  return { id: raw.id, projectId: raw.projectId, name: raw.name, dueDate: raw.dueDate, status, progress, taskCount: tasks.length };
}

export function deriveProjectDetail(db: RawDatabase, raw: RawProject): ProjectDetail {
  const base = deriveProject(db, raw);
  const h = computeProjectHealth(db, raw);
  return {
    ...base,
    milestones: db.milestones.filter((m) => m.projectId === raw.id).map((m) => deriveMilestone(db, m)),
    healthReasons: h.reasons,
  };
}
