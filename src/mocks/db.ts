import type { Paginated } from '@/shared/types/api';
import type { Role } from '@/shared/lib/permissions';
import type { Project, ProjectDetail } from '@/entities/project/model/types';
import type { Task, TaskDetail, TaskStatus } from '@/entities/task/model/types';
import type { Member } from '@/entities/member/model/types';
import type { Activity } from '@/entities/activity/model/types';
import type { Notification } from '@/entities/notification/model/types';
import type { ActivityAction, ActivityEntityType } from '@/entities/activity/model/types';
import { createSeed } from './seed';
import type { RawActivity, RawDatabase, RawTask } from './types';
import { deriveMember, deriveProject, deriveProjectDetail, deriveTask, deriveTaskDetail, userSummary } from './derive';

declare global {
  var __cadenceMockDb: RawDatabase | undefined;
}

function loadDatabase(): RawDatabase {
  if (!globalThis.__cadenceMockDb) {
    globalThis.__cadenceMockDb = createSeed();
  }
  return globalThis.__cadenceMockDb;
}

/** In-memory store — persisted on `globalThis` so Vite HMR does not wipe mutations mid-session. */
let database = loadDatabase();

export function getDb(): RawDatabase {
  return database;
}

/** Re-seed the store — used by tests for isolation. */
export function resetDb(seed = 42): void {
  database = createSeed(seed);
  globalThis.__cadenceMockDb = database;
}

// --- generic list processing ------------------------------------------------

export interface ListInput {
  page: number;
  pageSize: number;
  search: string;
  sort?: string;
  dir: 'asc' | 'desc';
  filters: Record<string, string>;
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: safePage, pageSize, total, totalPages };
}

function sortBy<T>(items: T[], accessor: (item: T) => string | number, dir: 'asc' | 'desc'): T[] {
  const sorted = [...items].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

// --- activity + notification generation ------------------------------------

function pushActivity(input: {
  actorMemberId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  projectId?: string;
  metadata?: Record<string, string>;
}): void {
  const actor = database.members.find((m) => m.id === input.actorMemberId) ?? database.members[0];
  const activity: RawActivity = {
    id: `act_${database.activities.length + 1}_${Date.now()}`,
    actorId: actor.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    projectId: input.projectId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };
  database.activities.unshift(activity);
}

function pushNotification(input: { kind: Notification['kind']; title: string; body: string; href?: string }): void {
  database.notifications.unshift({
    id: `ntf_${database.notifications.length + 1}_${Date.now()}`,
    userId: database.currentUserId,
    read: false,
    createdAt: new Date().toISOString(),
    ...input,
  });
}

// --- projects ---------------------------------------------------------------

export function listProjects(input: ListInput): Paginated<Project> {
  let items = database.projects.map((p) => deriveProject(database, p));
  if (input.filters.status) items = items.filter((p) => p.status === input.filters.status);
  if (input.filters.health) items = items.filter((p) => p.health === input.filters.health);
  if (input.filters.workspaceId) items = items.filter((p) => p.workspaceId === input.filters.workspaceId);
  if (input.search) {
    const q = input.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q));
  }
  const accessors: Record<string, (p: Project) => string | number> = {
    name: (p) => p.name.toLowerCase(),
    progress: (p) => p.progress,
    budget: (p) => p.budget,
    targetDate: (p) => p.targetDate,
    health: (p) => p.health,
  };
  if (input.sort && accessors[input.sort]) items = sortBy(items, accessors[input.sort], input.dir);
  return paginate(items, input.page, input.pageSize);
}

export function getProject(id: string): ProjectDetail | undefined {
  const raw = database.projects.find((p) => p.id === id);
  return raw ? deriveProjectDetail(database, raw) : undefined;
}

export interface CreateProjectInput {
  name: string;
  key?: string;
  workspaceId: string;
  budget: number;
  startDate: string;
  targetDate: string;
  status?: Project['status'];
}

function toIsoDate(value: string): string {
  return value.includes('T') ? value : `${value}T00:00:00.000Z`;
}

function nextProjectKey(workspaceKey: string): string {
  const prefix = `${workspaceKey}-`;
  const nums = database.projects
    .filter((p) => p.key.startsWith(prefix))
    .map((p) => Number(p.key.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  return `${workspaceKey}-${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

export function createProject(input: CreateProjectInput, actorMemberId: string): ProjectDetail {
  const workspace = database.workspaces.find((w) => w.id === input.workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const key = (input.key?.trim() || nextProjectKey(workspace.key)).toUpperCase();
  const raw = {
    id: `prj_new_${database.projects.length + 1}_${Date.now()}`,
    name: input.name.trim(),
    key,
    workspaceId: workspace.id,
    clientId: workspace.clientId,
    status: input.status ?? ('planning' as const),
    ownerId: actorMemberId,
    memberIds: [actorMemberId],
    budget: input.budget,
    startDate: toIsoDate(input.startDate),
    targetDate: toIsoDate(input.targetDate),
  };
  database.projects.unshift(raw);
  pushActivity({
    actorMemberId,
    action: 'project.created',
    entityType: 'project',
    entityId: raw.id,
    entityLabel: raw.name,
    projectId: raw.id,
  });
  pushNotification({
    kind: 'system',
    title: 'Project created',
    body: `${raw.name} (${raw.key}) was added.`,
    href: `/projects/${raw.id}`,
  });
  return deriveProjectDetail(database, raw);
}

// --- tasks ------------------------------------------------------------------

export function listTasks(projectId: string | undefined, input: ListInput): Paginated<Task> {
  let raw = database.tasks;
  if (projectId) raw = raw.filter((t) => t.projectId === projectId);
  if (input.filters.status) raw = raw.filter((t) => t.status === input.filters.status);
  if (input.filters.priority) raw = raw.filter((t) => t.priority === input.filters.priority);
  if (input.filters.assigneeId) raw = raw.filter((t) => t.assigneeId === input.filters.assigneeId);
  let items = raw.map((t) => deriveTask(database, t));
  if (input.search) {
    const q = input.search.toLowerCase();
    items = items.filter((t) => t.title.toLowerCase().includes(q));
  }
  const accessors: Record<string, (t: Task) => string | number> = {
    title: (t) => t.title.toLowerCase(),
    priority: (t) => ['low', 'medium', 'high', 'urgent'].indexOf(t.priority),
    dueDate: (t) => t.dueDate ?? '9999',
    status: (t) => t.status,
  };
  if (input.sort && accessors[input.sort]) items = sortBy(items, accessors[input.sort], input.dir);
  return paginate(items, input.page, input.pageSize);
}

export function getTask(id: string): TaskDetail | undefined {
  const raw = database.tasks.find((t) => t.id === id);
  return raw ? deriveTaskDetail(database, raw) : undefined;
}

function findRawTask(id: string): RawTask | undefined {
  return database.tasks.find((t) => t.id === id);
}

export function updateTaskStatus(id: string, status: TaskStatus, actorMemberId: string): TaskDetail | undefined {
  const raw = findRawTask(id);
  if (!raw) return undefined;
  const from = raw.status;
  raw.status = status;
  raw.updatedAt = new Date().toISOString();
  const project = database.projects.find((p) => p.id === raw.projectId);
  pushActivity({
    actorMemberId,
    action: 'task.status_changed',
    entityType: 'task',
    entityId: id,
    entityLabel: raw.title,
    projectId: raw.projectId,
    metadata: { from, to: status },
  });
  if (status === 'blocked' && project) {
    pushNotification({ kind: 'risk', title: 'Task blocked', body: `"${raw.title}" is now blocked in ${project.name}.`, href: `/projects/${project.id}` });
  }
  return deriveTaskDetail(database, raw);
}

export function reassignTask(id: string, assigneeMemberId: string | undefined, actorMemberId: string): TaskDetail | undefined {
  const raw = findRawTask(id);
  if (!raw) return undefined;
  const prev = raw.assigneeId;
  raw.assigneeId = assigneeMemberId;
  raw.updatedAt = new Date().toISOString();
  const toName = assigneeMemberId ? userSummary(database, database.members.find((m) => m.id === assigneeMemberId)?.userId ?? '').name : 'Unassigned';
  const fromName = prev ? userSummary(database, database.members.find((m) => m.id === prev)?.userId ?? '').name : 'Unassigned';
  pushActivity({
    actorMemberId,
    action: 'task.reassigned',
    entityType: 'task',
    entityId: id,
    entityLabel: raw.title,
    projectId: raw.projectId,
    metadata: { from: fromName, to: toName },
  });
  return deriveTaskDetail(database, raw);
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority: RawTask['priority'];
  assigneeId?: string;
  estimateHours: number;
  dueDate?: string;
}

export function createTask(input: CreateTaskInput, actorMemberId: string): TaskDetail {
  const raw: RawTask = {
    id: `tsk_new_${database.tasks.length + 1}_${Date.now()}`,
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? '',
    status: 'todo',
    priority: input.priority,
    assigneeId: input.assigneeId,
    estimateHours: input.estimateHours,
    loggedHours: 0,
    dueDate: input.dueDate,
    labels: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  database.tasks.unshift(raw);
  pushActivity({
    actorMemberId,
    action: 'task.created',
    entityType: 'task',
    entityId: raw.id,
    entityLabel: raw.title,
    projectId: raw.projectId,
  });
  return deriveTaskDetail(database, raw);
}

export function addComment(taskId: string, body: string, actorMemberId: string): TaskDetail | undefined {
  const raw = findRawTask(taskId);
  if (!raw) return undefined;
  const author = database.members.find((m) => m.id === actorMemberId) ?? database.members[0];
  database.comments.push({
    id: `cmt_${database.comments.length + 1}_${Date.now()}`,
    taskId,
    authorId: author.userId,
    body,
    createdAt: new Date().toISOString(),
  });
  return deriveTaskDetail(database, raw);
}

// --- members ----------------------------------------------------------------

export function listMembers(input: ListInput): Paginated<Member> {
  let items = database.members.map((m) => deriveMember(database, m));
  if (input.filters.role) items = items.filter((m) => m.role === input.filters.role);
  if (input.filters.status) items = items.filter((m) => m.status === input.filters.status);
  if (input.filters.workspaceId) items = items.filter((m) => m.workspaceIds.includes(input.filters.workspaceId));
  if (input.search) {
    const q = input.search.toLowerCase();
    items = items.filter((m) => m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q));
  }
  const accessors: Record<string, (m: Member) => string | number> = {
    name: (m) => m.user.name.toLowerCase(),
    role: (m) => m.role,
    utilization: (m) => m.utilization,
    capacity: (m) => m.capacity,
  };
  if (input.sort && accessors[input.sort]) items = sortBy(items, accessors[input.sort], input.dir);
  return paginate(items, input.page, input.pageSize);
}

export function listAllMembers(): Member[] {
  return database.members.map((m) => deriveMember(database, m));
}

export function listMemberTasks(memberId: string): Task[] {
  return database.tasks
    .filter((t) => t.assigneeId === memberId && t.status !== 'done')
    .map((t) => deriveTask(database, t))
    .sort((a, b) => ['urgent', 'high', 'medium', 'low'].indexOf(a.priority) - ['urgent', 'high', 'medium', 'low'].indexOf(b.priority));
}

export function inviteMember(input: { name: string; email: string; role: Role; workspaceIds: string[] }, actorMemberId: string): Member {
  const userId = `usr_new_${database.users.length + 1}`;
  database.users.push({ id: userId, name: input.name, email: input.email });
  const raw = {
    id: `mem_new_${database.members.length + 1}`,
    userId,
    role: input.role,
    status: 'invited' as const,
    title: 'Invited',
    capacity: 40,
    workspaceIds: input.workspaceIds,
    joinedAt: new Date().toISOString(),
  };
  database.members.push(raw);
  pushActivity({ actorMemberId, action: 'member.invited', entityType: 'member', entityId: raw.id, entityLabel: input.name, metadata: { role: input.role } });
  pushNotification({ kind: 'system', title: 'Invitation sent', body: `${input.name} was invited as ${input.role}.`, href: '/members' });
  return deriveMember(database, raw);
}

export function updateMemberRole(memberId: string, role: Role, actorMemberId: string): Member | undefined {
  const raw = database.members.find((m) => m.id === memberId);
  if (!raw) return undefined;
  const from = raw.role;
  raw.role = role;
  pushActivity({ actorMemberId, action: 'member.role_changed', entityType: 'member', entityId: memberId, entityLabel: userSummary(database, raw.userId).name, metadata: { from, to: role } });
  return deriveMember(database, raw);
}

export function setMemberStatus(memberId: string, status: 'active' | 'deactivated'): Member | undefined {
  const raw = database.members.find((m) => m.id === memberId);
  if (!raw) return undefined;
  raw.status = status;
  return deriveMember(database, raw);
}

// --- activities -------------------------------------------------------------

export function listActivities(input: ListInput, projectId?: string): Paginated<Activity> {
  let raw = database.activities;
  if (projectId) raw = raw.filter((a) => a.projectId === projectId);
  const items: Activity[] = raw.map((a) => ({
    id: a.id,
    actor: userSummary(database, a.actorId),
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    entityLabel: a.entityLabel,
    projectId: a.projectId,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));
  return paginate(items, input.page, input.pageSize);
}

// --- notifications ----------------------------------------------------------

export function listNotifications(): Notification[] {
  return database.notifications
    .filter((n) => n.userId === database.currentUserId)
    .map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, read: n.read, href: n.href, createdAt: n.createdAt }));
}

export function markNotificationRead(id: string, read: boolean): void {
  const n = database.notifications.find((x) => x.id === id);
  if (n) n.read = read;
}

export function markAllNotificationsRead(): void {
  database.notifications.filter((n) => n.userId === database.currentUserId).forEach((n) => (n.read = true));
}

// --- reference data ---------------------------------------------------------

export function listWorkspaces() {
  return database.workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    key: w.key,
    clientId: w.clientId,
    projectCount: database.projects.filter((p) => p.workspaceId === w.id).length,
    memberCount: database.members.filter((m) => m.workspaceIds.includes(w.id)).length,
  }));
}

export function getOrganization() {
  return {
    id: database.organizationId,
    name: database.organizationName,
    memberCount: database.members.length,
    workspaceCount: database.workspaces.length,
  };
}

// --- billing ----------------------------------------------------------------

export function getBillingOverview() {
  const seats = database.members.filter((m) => m.status !== 'deactivated').length;
  const activeProjects = database.projects.filter((p) => !['archived', 'completed'].includes(p.status)).length;
  return {
    subscription: {
      planId: database.subscription.planId,
      status: database.subscription.status,
      seats,
      renewsAt: database.subscription.renewsAt,
      amountDue: database.invoices.find((i) => i.status === 'open')?.amount ?? 0,
    },
    paymentMethod: database.paymentMethod,
    usage: [
      { label: 'Seats', used: seats, limit: 50 },
      { label: 'Active projects', used: activeProjects, limit: 100 },
      { label: 'Storage (GB)', used: 42, limit: 250 },
      { label: 'API requests (K/mo)', used: 128, limit: 500 },
    ],
  };
}

export function listInvoices() {
  return database.invoices.map((i) => ({ id: i.id, number: i.number, date: i.date, amount: i.amount, status: i.status }));
}

export function updatePaymentMethod(input: { brand: string; last4: string; expMonth: number; expYear: number }) {
  database.paymentMethod = input;
  pushActivity({ actorMemberId: database.currentUserId, action: 'settings.updated', entityType: 'settings', entityId: 'billing', entityLabel: 'Payment method' });
  return database.paymentMethod;
}

export function changePlan(planId: RawDatabase['subscription']['planId']) {
  database.subscription.planId = planId;
  pushActivity({ actorMemberId: database.currentUserId, action: 'settings.updated', entityType: 'settings', entityId: 'plan', entityLabel: `Plan changed to ${planId}` });
  return getBillingOverview();
}

export function getCurrentMemberRole(): Role {
  return database.members.find((m) => m.id === database.currentUserId)?.role ?? 'viewer';
}
