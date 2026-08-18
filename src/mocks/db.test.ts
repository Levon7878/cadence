import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDb, reassignTask, updateTaskStatus, listActivities, createProject } from './db';
import { deriveMember, deriveProject } from './derive';

beforeEach(() => resetDb());

describe('interconnected mock data', () => {
  it('derives project progress from task completion', () => {
    const db = getDb();
    const project = db.projects[1];
    const before = deriveProject(db, project).progress;

    // Complete every open task in the project.
    db.tasks.filter((t) => t.projectId === project.id).forEach((t) => (t.status = 'done'));
    const after = deriveProject(db, project).progress;

    expect(after).toBe(100);
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('updates a member\'s allocation when a task is reassigned to them', () => {
    const db = getDb();
    const target = db.members.find((m) => m.status === 'active')!;
    const task = db.tasks.find((t) => t.assigneeId !== target.id && ['todo', 'in_progress'].includes(t.status))!;

    const before = deriveMember(db, target).allocation;
    reassignTask(task.id, target.id, db.currentUserId);
    const after = deriveMember(db, target).allocation;

    expect(after).toBe(before + task.estimateHours);
  });

  it('records an immutable activity when a task status changes', () => {
    const db = getDb();
    const task = db.tasks[0];
    updateTaskStatus(task.id, 'blocked', db.currentUserId);

    const activities = listActivities({ page: 1, pageSize: 5, search: '', dir: 'desc', filters: {} });
    const latest = activities.items[0];
    expect(latest.action).toBe('task.status_changed');
    expect(latest.entityId).toBe(task.id);
    expect(latest.metadata?.to).toBe('blocked');
  });

  it('creates a project owned by the actor and records activity', () => {
    const db = getDb();
    const before = db.projects.length;
    const workspace = db.workspaces[0];

    const created = createProject(
      {
        name: 'Harbor Checkout',
        workspaceId: workspace.id,
        budget: 80_000,
        startDate: '2026-08-17',
        targetDate: '2026-11-15',
      },
      db.currentUserId,
    );

    expect(db.projects.length).toBe(before + 1);
    expect(created.name).toBe('Harbor Checkout');
    expect(created.workspaceId).toBe(workspace.id);
    expect(created.status).toBe('planning');
    expect(created.owner.id).toBe(db.users[0].id);
    expect(created.key.startsWith(`${workspace.key}-`)).toBe(true);

    const activities = listActivities({ page: 1, pageSize: 5, search: '', dir: 'desc', filters: {} });
    expect(activities.items[0].action).toBe('project.created');
    expect(activities.items[0].entityId).toBe(created.id);
  });

  it('recomputes health so a blocked-heavy project is not on track', () => {
    const db = getDb();
    const project = db.projects[0]; // seeded flagship at-risk project
    const derived = deriveProject(db, project);
    expect(derived.health).not.toBe('on_track');
  });
});
