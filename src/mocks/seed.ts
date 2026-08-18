import type { Role } from '@/shared/lib/permissions';
import type { TaskPriority, TaskStatus } from '@/entities/task/model/types';
import type { ProjectStatus } from '@/entities/project/model/types';
import { createRng } from './rng';
import type {
  RawActivity,
  RawComment,
  RawDatabase,
  RawInvoice,
  RawMember,
  RawMilestone,
  RawNotification,
  RawProject,
  RawTask,
  RawUser,
} from './types';

const FIRST_NAMES = ['Ava', 'Liam', 'Noah', 'Emma', 'Mia', 'Kai', 'Sofia', 'Ivan', 'Lena', 'Omar', 'Priya', 'Diego', 'Yuki', 'Nadia', 'Theo', 'Zara', 'Ravi', 'Elin', 'Marco', 'Hana', 'Jonas', 'Amara', 'Leo', 'Nora', 'Idris', 'Freya', 'Sven', 'Tara', 'Mateo', 'Cleo', 'Rhea', 'Owen'];
const LAST_NAMES = ['Reyes', 'Chen', 'Novak', 'Patel', 'Okafor', 'Haas', 'Ibrahim', 'Larsen', 'Costa', 'Sato', 'Meyer', 'Duarte', 'Kowalski', 'Sørensen', 'Rossi', 'Nguyen', 'Bauer', 'Silva', 'Volkov', 'Adeyemi', 'Fischer', 'Moreau', 'Grant', 'Weiss', 'Petit'];
const TITLES = ['Engineer', 'Senior Engineer', 'Product Designer', 'Engineering Lead', 'QA Engineer', 'Delivery Manager', 'Product Manager', 'Staff Engineer', 'UX Researcher', 'DevOps Engineer'];
const CLIENT_NAMES = ['Northwind Retail', 'Helios Bank', 'Vertex Health', 'Loom Logistics', 'Aperture Media', 'Cobalt Energy'];
const PROJECT_ADJ = ['Atlas', 'Beacon', 'Cascade', 'Delta', 'Ember', 'Forge', 'Nimbus', 'Orbit', 'Pulse', 'Quartz', 'Relay', 'Summit', 'Tide', 'Vector', 'Willow', 'Zephyr', 'Harbor', 'Comet'];
const PROJECT_NOUN = ['Platform', 'Portal', 'Migration', 'Redesign', 'Mobile App', 'Data Pipeline', 'Checkout', 'Dashboard', 'API', 'Onboarding'];
const TASK_VERBS = ['Implement', 'Design', 'Refactor', 'Fix', 'Investigate', 'Document', 'Optimize', 'Review', 'Migrate', 'Add', 'Remove', 'Test'];
const TASK_NOUNS = ['authentication flow', 'billing webhook', 'search index', 'export pipeline', 'settings page', 'notification service', 'audit log', 'rate limiter', 'onboarding wizard', 'permission checks', 'dark mode', 'CSV importer', 'chart tooltips', 'session handling', 'error boundary', 'feature flags', 'cache layer', 'form validation'];
const LABELS = ['frontend', 'backend', 'design', 'infra', 'bug', 'tech-debt', 'security', 'a11y', 'performance'];
const MILESTONE_NAMES = ['Discovery', 'Foundations', 'Alpha', 'Beta', 'Launch', 'Hardening'];

const DAY = 86_400_000;

const iso = (offsetDays: number, base = Date.now()) => new Date(base + offsetDays * DAY).toISOString();

export function createSeed(seed = 42): RawDatabase {
  const rng = createRng(seed);
  const now = Date.now();

  const organizationId = 'org_cadence';

  // Users + members --------------------------------------------------------
  const users: RawUser[] = [];
  const members: RawMember[] = [];
  const memberCount = 32;

  const roleForIndex = (i: number): Role => {
    if (i === 0) return 'owner';
    if (i <= 2) return 'admin';
    if (i <= 7) return 'manager';
    if (i >= memberCount - 5) return 'viewer';
    return 'member';
  };

  const usedNames = new Set<string>();
  for (let i = 0; i < memberCount; i++) {
    let name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    while (usedNames.has(name)) name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    usedNames.add(name);
    const id = `usr_${i + 1}`;
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@cadence.dev`;
    users.push({ id, name, email });
    members.push({
      id: `mem_${i + 1}`,
      userId: id,
      role: roleForIndex(i),
      status: i > 0 && rng.bool(0.06) ? (rng.bool(0.5) ? 'invited' : 'deactivated') : 'active',
      title: i === 0 ? 'Founder & CEO' : rng.pick(TITLES),
      capacity: rng.pick([30, 32, 35, 40, 40, 40]),
      workspaceIds: [],
      joinedAt: iso(-rng.int(30, 900), now),
    });
  }
  // Make the current user a friendly, recognizable owner.
  users[0].name = 'Alex Morgan';
  users[0].email = 'alex.morgan@cadence.dev';
  members[0].title = 'Founder & CEO';

  // Clients + workspaces ---------------------------------------------------
  const clients = CLIENT_NAMES.slice(0, 5).map((name, i) => ({
    id: `cli_${i + 1}`,
    name,
    contactName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    contactEmail: `contact@${name.toLowerCase().replace(/[^a-z]+/g, '')}.com`,
  }));

  const workspaces = clients.map((client, i) => ({
    id: `wsp_${i + 1}`,
    name: client.name,
    key: client.name.split(' ')[0].slice(0, 3).toUpperCase(),
    clientId: client.id,
  }));

  // Assign each member to 1–3 workspaces.
  for (const member of members) {
    member.workspaceIds = rng.sample(workspaces, rng.int(1, 3)).map((w) => w.id);
  }
  const activeMemberIds = members.filter((m) => m.status === 'active').map((m) => m.id);

  // Projects ---------------------------------------------------------------
  const projects: RawProject[] = [];
  const milestones: RawMilestone[] = [];
  const projectCount = 18;
  const managerIds = members.filter((m) => ['owner', 'admin', 'manager'].includes(m.role)).map((m) => m.id);

  for (let i = 0; i < projectCount; i++) {
    const workspace = workspaces[i % workspaces.length];
    const name = `${rng.pick(PROJECT_ADJ)} ${rng.pick(PROJECT_NOUN)}`;
    const start = -rng.int(20, 220);
    const durationDays = rng.int(60, 200);
    const target = start + durationDays;

    // Force a spread of statuses; guarantee an at-risk and a completed one.
    let status: ProjectStatus;
    if (i === 0) status = 'at_risk';
    else if (i === 1) status = 'active';
    else status = rng.pick<ProjectStatus>(['planning', 'active', 'active', 'at_risk', 'on_hold', 'completed']);

    const completedDate = status === 'completed' ? iso(target - rng.int(-10, 15), now) : undefined;
    const projectMembers = rng.sample(activeMemberIds, rng.int(4, 8));
    const owner = rng.pick(managerIds);

    const project: RawProject = {
      id: `prj_${i + 1}`,
      name,
      key: `${workspace.key}-${i + 1}`,
      workspaceId: workspace.id,
      clientId: workspace.clientId,
      status,
      ownerId: owner,
      memberIds: [...new Set([owner, ...projectMembers])],
      budget: rng.pick([60_000, 90_000, 120_000, 150_000, 200_000, 280_000]),
      startDate: iso(start, now),
      targetDate: iso(target, now),
      completedDate,
    };
    projects.push(project);

    const milestoneCount = rng.int(3, 5);
    for (let m = 0; m < milestoneCount; m++) {
      milestones.push({
        id: `mil_${project.id}_${m + 1}`,
        projectId: project.id,
        name: MILESTONE_NAMES[m] ?? `Phase ${m + 1}`,
        dueDate: iso(start + Math.round((durationDays / milestoneCount) * (m + 1)), now),
      });
    }
  }

  // Tasks ------------------------------------------------------------------
  const tasks: RawTask[] = [];
  const statusPool: TaskStatus[] = ['backlog', 'todo', 'todo', 'in_progress', 'in_progress', 'in_review', 'done', 'done', 'done', 'blocked'];
  const priorityPool: TaskPriority[] = ['low', 'medium', 'medium', 'high', 'high', 'urgent'];
  let taskSeq = 0;

  for (const project of projects) {
    const projectMilestones = milestones.filter((m) => m.projectId === project.id);
    const taskCount = rng.int(10, 18);
    const isAtRiskProject = project.id === 'prj_1';

    for (let t = 0; t < taskCount; t++) {
      taskSeq += 1;
      let status = rng.pick(statusPool);
      // The flagship at-risk project has extra blocked/urgent tasks.
      if (isAtRiskProject && t < 4) status = rng.pick<TaskStatus>(['blocked', 'in_progress', 'blocked', 'todo']);
      if (project.status === 'completed') status = rng.bool(0.85) ? 'done' : 'in_review';

      const estimate = rng.pick([2, 3, 5, 8, 8, 13, 20]);
      const logged =
        status === 'done'
          ? Math.round(estimate * rng.float(0.8, 1.3))
          : status === 'backlog' || status === 'todo'
            ? 0
            : Math.round(estimate * rng.float(0.2, 0.9));

      const assignee = rng.bool(0.9) ? rng.pick(project.memberIds) : undefined;
      const dueOffset = rng.int(-20, 60);

      tasks.push({
        id: `tsk_${taskSeq}`,
        projectId: project.id,
        milestoneId: rng.bool(0.8) ? rng.pick(projectMilestones).id : undefined,
        title: `${rng.pick(TASK_VERBS)} ${rng.pick(TASK_NOUNS)}`,
        description: 'Detailed acceptance criteria and context for this unit of work.',
        status,
        priority: isAtRiskProject && t < 4 ? 'urgent' : rng.pick(priorityPool),
        assigneeId: assignee,
        estimateHours: estimate,
        loggedHours: logged,
        dueDate: status === 'done' ? undefined : iso(dueOffset, now),
        labels: rng.sample(LABELS, rng.int(1, 3)),
        createdAt: iso(-rng.int(5, 120), now),
        updatedAt: iso(-rng.int(0, 5), now),
      });
    }
  }

  // Comments ---------------------------------------------------------------
  const comments: RawComment[] = [];
  for (const task of tasks) {
    if (!rng.bool(0.35)) continue;
    const count = rng.int(1, 3);
    for (let c = 0; c < count; c++) {
      comments.push({
        id: `cmt_${comments.length + 1}`,
        taskId: task.id,
        authorId: rng.pick(activeMemberIds),
        body: rng.pick([
          'Pushed a first pass — ready for another look.',
          'Blocked on the API contract, following up with backend.',
          'Confirmed with the client, we can proceed.',
          'Added tests and updated the docs.',
          'This is trickier than estimated, bumping the estimate.',
        ]),
        createdAt: iso(-rng.int(0, 20), now),
      });
    }
  }

  // Activities (historical audit trail) -----------------------------------
  const activities: RawActivity[] = [];
  for (let i = 0; i < 46; i++) {
    const project = rng.pick(projects);
    const actor = rng.pick(members).id;
    const kind = rng.pick(['task.status_changed', 'task.reassigned', 'project.created', 'member.invited', 'invoice.paid', 'project.budget_updated'] as const);
    activities.push({
      id: `act_${i + 1}`,
      actorId: actor,
      action: kind,
      entityType: kind.startsWith('task') ? 'task' : kind.startsWith('project') ? 'project' : kind.startsWith('member') ? 'member' : 'invoice',
      entityId: kind.startsWith('task') ? rng.pick(tasks).id : project.id,
      entityLabel: kind.startsWith('project') ? project.name : kind.startsWith('member') ? rng.pick(users).name : rng.pick(tasks).title,
      projectId: kind.startsWith('task') || kind.startsWith('project') ? project.id : undefined,
      createdAt: iso(-rng.int(0, 40), now),
    });
  }
  activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Notifications for the current user ------------------------------------
  const notifications: RawNotification[] = [
    { id: 'ntf_1', userId: 'mem_1', kind: 'risk', title: 'Project health dropped', body: `${projects[0].name} moved to Off track.`, read: false, href: `/projects/${projects[0].id}`, createdAt: iso(-0.2, now) },
    { id: 'ntf_2', userId: 'mem_1', kind: 'assignment', title: 'New task assigned', body: 'You were assigned "Review permission checks".', read: false, href: `/projects/${projects[1].id}`, createdAt: iso(-0.5, now) },
    { id: 'ntf_3', userId: 'mem_1', kind: 'deadline', title: 'Milestone due soon', body: 'Beta milestone is due in 3 days.', read: false, href: `/projects/${projects[1].id}`, createdAt: iso(-1, now) },
    { id: 'ntf_4', userId: 'mem_1', kind: 'billing', title: 'Invoice paid', body: 'Your monthly invoice was paid successfully.', read: true, href: '/billing', createdAt: iso(-3, now) },
    { id: 'ntf_5', userId: 'mem_1', kind: 'mention', title: 'You were mentioned', body: 'Ivan mentioned you in a comment.', read: true, href: `/projects/${projects[2].id}`, createdAt: iso(-4, now) },
    { id: 'ntf_6', userId: 'mem_1', kind: 'system', title: 'Weekly summary ready', body: 'Your delivery report for last week is ready.', read: true, href: '/analytics', createdAt: iso(-6, now) },
  ];

  // Invoices (11 months) ---------------------------------------------------
  const invoices: RawInvoice[] = [];
  for (let i = 0; i < 11; i++) {
    invoices.push({
      id: `inv_${i + 1}`,
      number: `CDN-2026-${String(1000 - i)}`,
      date: new Date(now - i * 30 * DAY).toISOString(),
      amount: 499,
      status: i === 0 ? 'open' : 'paid',
    });
  }

  return {
    organizationId,
    organizationName: 'Cadence Studio',
    hourlyRate: 120,
    users,
    members,
    clients,
    workspaces,
    projects,
    milestones,
    tasks,
    comments,
    activities,
    notifications,
    invoices,
    subscription: { planId: 'growth', status: 'active', renewsAt: iso(24, now) },
    paymentMethod: { brand: 'Visa', last4: '4242', expMonth: 8, expYear: 2028 },
    currentUserId: 'mem_1',
  };
}
