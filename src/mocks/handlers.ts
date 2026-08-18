import { http, HttpResponse, delay } from 'msw';
import { can, ROLES, type Permission, type Role } from '@/shared/lib/permissions';
import type { PlanId } from '@/entities/billing/model/types';
import * as db from './db';
import type { ListInput } from './db';

const PLANS = [
  { id: 'starter', name: 'Starter', pricePerMonth: 0, description: 'For small teams getting started.', seatLimit: 5, projectLimit: 5, features: ['Up to 5 members', '5 active projects', 'Core delivery tracking', 'Community support'] },
  { id: 'growth', name: 'Growth', pricePerMonth: 499, description: 'For scaling delivery organizations.', seatLimit: 50, projectLimit: 100, features: ['Up to 50 members', '100 active projects', 'Advanced analytics', 'Role-based access', 'Priority support'] },
  { id: 'scale', name: 'Scale', pricePerMonth: 1299, description: 'For enterprises with complex needs.', seatLimit: 250, projectLimit: 1000, features: ['Unlimited members', 'Unlimited projects', 'Custom SSO & SAML', 'Audit exports', 'Dedicated CSM'] },
];

function jsonError(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ code, message, fieldErrors }, { status });
}

interface Auth {
  memberId: string;
  role: Role;
}

/** Resolve the caller from the bearer token, applying the dev demo-role override. */
function getAuth(request: Request): Auth | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  if (!token.startsWith('tok_')) return null;
  const memberId = token.slice(4);
  const baseRole = db.getDb().members.find((m) => m.id === memberId)?.role ?? 'viewer';
  const demo = request.headers.get('X-Demo-Role');
  const role = demo && (ROLES as readonly string[]).includes(demo) ? (demo as Role) : baseRole;
  return { memberId, role };
}

function parseList(url: URL): ListInput {
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (!['page', 'pageSize', 'search', 'sort', 'dir'].includes(key)) filters[key] = value;
  }
  return {
    page: Number(url.searchParams.get('page') ?? '1') || 1,
    pageSize: Number(url.searchParams.get('pageSize') ?? '10') || 10,
    search: url.searchParams.get('search') ?? '',
    sort: url.searchParams.get('sort') ?? undefined,
    dir: (url.searchParams.get('dir') as 'asc' | 'desc') ?? 'asc',
    filters,
  };
}

async function withLatency() {
  await delay(120 + Math.random() * 260);
}

/** Guards a handler: returns 401 if unauthenticated, 403 if lacking permission. */
function authorize(request: Request, permission?: Permission): { auth: Auth } | { error: Response } {
  const auth = getAuth(request);
  if (!auth) return { error: jsonError(401, 'unauthenticated', 'Your session has expired. Please sign in again.') };
  if (permission && !can({ role: auth.role, id: auth.memberId }, permission)) {
    return { error: jsonError(403, 'forbidden', `You don't have permission to ${permission.replace(':', ' ')}.`) };
  }
  return { auth };
}

/** Scope mocks to `/api` so they cannot intercept Vite source modules (e.g. `/src/pages/projects/:file`). */
const api = (path: string) => `*/api${path}`;

export const handlers = [
  // --- auth -----------------------------------------------------------------
  http.post(api('/auth/login'), async ({ request }) => {
    await withLatency();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return jsonError(422, 'validation_error', 'Email and password are required.', {
        ...(body.email ? {} : { email: 'Email is required' }),
        ...(body.password ? {} : { password: 'Password is required' }),
      });
    }
    if (body.password.length < 6) {
      return jsonError(401, 'invalid_credentials', 'Invalid email or password.');
    }
    const database = db.getDb();
    const me = database.members.find((m) => m.id === database.currentUserId)!;
    const user = database.users.find((u) => u.id === me.userId)!;
    return HttpResponse.json({
      token: `tok_${me.id}`,
      user: { id: user.id, name: user.name, email: user.email, role: me.role, organizationId: database.organizationId },
    });
  }),

  http.post(api('/auth/register'), async ({ request }) => {
    await withLatency();
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const fieldErrors: Record<string, string> = {};
    if (!body.name) fieldErrors.name = 'Name is required';
    if (!body.email) fieldErrors.email = 'Email is required';
    if (!body.password || body.password.length < 6) fieldErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(fieldErrors).length) return jsonError(422, 'validation_error', 'Please fix the errors below.', fieldErrors);
    const database = db.getDb();
    const me = database.members.find((m) => m.id === database.currentUserId)!;
    return HttpResponse.json({
      token: `tok_${me.id}`,
      user: { id: 'usr_new', name: body.name, email: body.email, role: 'owner', organizationId: database.organizationId },
    });
  }),

  http.post(api('/auth/forgot-password'), async () => {
    await withLatency();
    return HttpResponse.json({ ok: true });
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    const database = db.getDb();
    const me = database.members.find((m) => m.id === guard.auth.memberId);
    if (!me) return jsonError(404, 'not_found', 'Member not found.');
    const user = database.users.find((u) => u.id === me.userId)!;
    return HttpResponse.json({ id: user.id, name: user.name, email: user.email, role: guard.auth.role, organizationId: database.organizationId });
  }),

  // --- organization / workspaces -------------------------------------------
  http.get(api('/organizations/me'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.getOrganization());
  }),

  http.get(api('/workspaces'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listWorkspaces());
  }),

  // --- projects -------------------------------------------------------------
  http.get(api('/projects'), async ({ request }) => {
    const guard = authorize(request, 'project:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listProjects(parseList(new URL(request.url))));
  }),

  http.post(api('/projects'), async ({ request }) => {
    const guard = authorize(request, 'project:create');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as db.CreateProjectInput;
    const fieldErrors: Record<string, string> = {};
    if (!body.name?.trim() || body.name.trim().length < 3) fieldErrors.name = 'Name must be at least 3 characters';
    if (!body.workspaceId) fieldErrors.workspaceId = 'Workspace is required';
    if (body.budget == null || Number.isNaN(Number(body.budget)) || Number(body.budget) < 0) {
      fieldErrors.budget = 'Budget must be 0 or more';
    }
    if (!body.startDate) fieldErrors.startDate = 'Start date is required';
    if (!body.targetDate) fieldErrors.targetDate = 'Target date is required';
    if (body.startDate && body.targetDate && body.targetDate < body.startDate) {
      fieldErrors.targetDate = 'Target date must be after the start date';
    }
    const key = body.key?.trim().toUpperCase();
    if (key && !/^[A-Z0-9][A-Z0-9-]{1,14}$/.test(key)) {
      fieldErrors.key = 'Use 2–15 letters, numbers, or hyphens';
    } else if (key && db.getDb().projects.some((p) => p.key === key)) {
      fieldErrors.key = 'This key is already in use';
    }
    if (Object.keys(fieldErrors).length) return jsonError(422, 'validation_error', 'Please fix the errors below.', fieldErrors);
    try {
      return HttpResponse.json(db.createProject({ ...body, key, budget: Number(body.budget) }, guard.auth.memberId), { status: 201 });
    } catch {
      return jsonError(422, 'validation_error', 'Workspace is required.', { workspaceId: 'Workspace is required' });
    }
  }),

  http.get(api('/projects/:id'), async ({ request, params }) => {
    const guard = authorize(request, 'project:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const id = decodeURIComponent(params.id as string);
    const project = db.getProject(id);
    return project ? HttpResponse.json(project) : jsonError(404, 'not_found', 'Project not found.');
  }),

  http.get(api('/projects/:id/tasks'), async ({ request, params }) => {
    const guard = authorize(request, 'task:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listTasks(decodeURIComponent(params.id as string), parseList(new URL(request.url))));
  }),

  http.get(api('/projects/:id/activities'), async ({ request, params }) => {
    const guard = authorize(request, 'project:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listActivities(parseList(new URL(request.url)), decodeURIComponent(params.id as string)));
  }),

  http.post(api('/projects/:id/tasks'), async ({ request, params }) => {
    const guard = authorize(request, 'task:create');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as db.CreateTaskInput;
    if (!body.title || body.title.trim().length < 3) {
      return jsonError(422, 'validation_error', 'Title is required.', { title: 'Title must be at least 3 characters' });
    }
    return HttpResponse.json(
      db.createTask({ ...body, projectId: decodeURIComponent(params.id as string) }, guard.auth.memberId),
      { status: 201 },
    );
  }),

  // --- tasks ----------------------------------------------------------------
  http.get(api('/tasks/:id'), async ({ request, params }) => {
    const guard = authorize(request, 'task:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const task = db.getTask(params.id as string);
    return task ? HttpResponse.json(task) : jsonError(404, 'not_found', 'Task not found.');
  }),

  http.patch(api('/tasks/:id'), async ({ request, params }) => {
    const auth = getAuth(request);
    if (!auth) return jsonError(401, 'unauthenticated', 'Your session has expired.');
    await withLatency();
    const id = params.id as string;
    const existing = db.getTask(id);
    if (!existing) return jsonError(404, 'not_found', 'Task not found.');
    const body = (await request.json()) as { status?: string; assigneeId?: string | null };

    const resource = { ownerId: existing.assignee?.id };
    if (body.status !== undefined) {
      if (!can({ role: auth.role, id: auth.memberId }, 'task:edit', resource)) {
        return jsonError(403, 'forbidden', "You don't have permission to change this task.");
      }
      const updated = db.updateTaskStatus(id, body.status as never, auth.memberId);
      return updated ? HttpResponse.json(updated) : jsonError(404, 'not_found', 'Task not found.');
    }
    if (body.assigneeId !== undefined) {
      if (!can({ role: auth.role, id: auth.memberId }, 'task:assign', resource)) {
        return jsonError(403, 'forbidden', "You don't have permission to reassign this task.");
      }
      const updated = db.reassignTask(id, body.assigneeId ?? undefined, auth.memberId);
      return updated ? HttpResponse.json(updated) : jsonError(404, 'not_found', 'Task not found.');
    }
    return jsonError(422, 'validation_error', 'No supported fields to update.');
  }),

  http.post(api('/tasks/:id/comments'), async ({ request, params }) => {
    const guard = authorize(request, 'task:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) return jsonError(422, 'validation_error', 'Comment cannot be empty.', { body: 'Required' });
    const updated = db.addComment(params.id as string, body.body, guard.auth.memberId);
    return updated ? HttpResponse.json(updated) : jsonError(404, 'not_found', 'Task not found.');
  }),

  // --- members --------------------------------------------------------------
  http.get(api('/members'), async ({ request }) => {
    const guard = authorize(request, 'member:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const url = new URL(request.url);
    if (url.searchParams.get('all') === 'true') return HttpResponse.json(db.listAllMembers());
    return HttpResponse.json(db.listMembers(parseList(url)));
  }),

  http.get(api('/members/:id/tasks'), async ({ request, params }) => {
    const guard = authorize(request, 'task:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listMemberTasks(params.id as string));
  }),

  http.post(api('/members'), async ({ request }) => {
    const guard = authorize(request, 'member:invite');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as { name?: string; email?: string; role?: Role; workspaceIds?: string[] };
    const fieldErrors: Record<string, string> = {};
    if (!body.name) fieldErrors.name = 'Name is required';
    if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) fieldErrors.email = 'A valid email is required';
    if (!body.role) fieldErrors.role = 'Role is required';
    if (Object.keys(fieldErrors).length) return jsonError(422, 'validation_error', 'Please fix the errors below.', fieldErrors);
    return HttpResponse.json(db.inviteMember({ name: body.name!, email: body.email!, role: body.role!, workspaceIds: body.workspaceIds ?? [] }, guard.auth.memberId), { status: 201 });
  }),

  http.patch(api('/members/:id'), async ({ request, params }) => {
    const body = (await request.json()) as { role?: Role; status?: 'active' | 'deactivated' };
    const permission: Permission = body.role ? 'role:assign' : 'member:edit';
    const guard = authorize(request, permission);
    if ('error' in guard) return guard.error;
    await withLatency();
    const id = params.id as string;
    if (body.role) {
      const updated = db.updateMemberRole(id, body.role, guard.auth.memberId);
      return updated ? HttpResponse.json(updated) : jsonError(404, 'not_found', 'Member not found.');
    }
    if (body.status) {
      const updated = db.setMemberStatus(id, body.status);
      return updated ? HttpResponse.json(updated) : jsonError(404, 'not_found', 'Member not found.');
    }
    return jsonError(422, 'validation_error', 'No supported fields to update.');
  }),

  // --- activities & notifications ------------------------------------------
  http.get(api('/activities'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listActivities(parseList(new URL(request.url))));
  }),

  http.get(api('/notifications'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listNotifications());
  }),

  http.patch(api('/notifications/:id'), async ({ request, params }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    const body = (await request.json()) as { read?: boolean };
    db.markNotificationRead(params.id as string, body.read ?? true);
    return HttpResponse.json({ ok: true });
  }),

  http.post(api('/notifications/read-all'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    db.markAllNotificationsRead();
    return HttpResponse.json({ ok: true });
  }),

  // --- analytics ------------------------------------------------------------
  http.get(api('/analytics/dashboard'), async ({ request }) => {
    const guard = authorize(request, 'analytics:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const { computeDashboard } = await import('./compute-analytics');
    return HttpResponse.json(computeDashboard(db.getDb()));
  }),

  http.get(api('/analytics/overview'), async ({ request }) => {
    const guard = authorize(request, 'analytics:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    const url = new URL(request.url);
    const { computeAnalytics } = await import('./compute-analytics');
    return HttpResponse.json(
      computeAnalytics(db.getDb(), {
        range: url.searchParams.get('range') ?? undefined,
        comparison: url.searchParams.get('comparison') ?? undefined,
        workspaceId: url.searchParams.get('workspaceId') ?? undefined,
        projectId: url.searchParams.get('projectId') ?? undefined,
        memberId: url.searchParams.get('memberId') ?? undefined,
      }),
    );
  }),

  // --- billing --------------------------------------------------------------
  http.get(api('/billing/overview'), async ({ request }) => {
    const guard = authorize(request, 'billing:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.getBillingOverview());
  }),

  http.get(api('/billing/plans'), async ({ request }) => {
    const guard = authorize(request, 'billing:view');
    if ('error' in guard) return guard.error;
    return HttpResponse.json(PLANS);
  }),

  http.get(api('/billing/invoices'), async ({ request }) => {
    const guard = authorize(request, 'billing:view');
    if ('error' in guard) return guard.error;
    await withLatency();
    return HttpResponse.json(db.listInvoices());
  }),

  http.put(api('/billing/payment-method'), async ({ request }) => {
    const guard = authorize(request, 'billing:manage');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as { brand: string; last4: string; expMonth: number; expYear: number };
    if (!/^\d{4}$/.test(String(body.last4))) return jsonError(422, 'validation_error', 'Invalid card number.', { last4: 'Enter the last 4 digits' });
    return HttpResponse.json(db.updatePaymentMethod(body));
  }),

  http.post(api('/billing/subscription'), async ({ request }) => {
    const guard = authorize(request, 'billing:manage');
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as { planId: PlanId };
    return HttpResponse.json(db.changePlan(body.planId));
  }),

  // --- settings -------------------------------------------------------------
  http.put(api('/settings/profile'), async ({ request }) => {
    const guard = authorize(request);
    if ('error' in guard) return guard.error;
    await withLatency();
    const body = (await request.json()) as { name?: string };
    if (!body.name?.trim()) return jsonError(422, 'validation_error', 'Name is required.', { name: 'Required' });
    return HttpResponse.json({ ok: true });
  }),

  // Unmatched /api calls must not fall through to Vite — SW passthrough then throws "Failed to fetch".
  http.all(/\/api(?:\/|$)/, async () => jsonError(404, 'not_found', 'No mock handler for this request.')),
];
