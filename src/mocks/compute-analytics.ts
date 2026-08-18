import type { DashboardData, AnalyticsData, KpiValue, Series, TimeSeriesPoint } from '@/entities/analytics/model/types';
import type { RawDatabase, RawProject } from './types';
import { deriveMember, deriveProject } from './derive';
import { createRng } from './rng';

const DAY = 86_400_000;

export interface AnalyticsParams {
  range?: string;
  comparison?: string;
  workspaceId?: string;
  projectId?: string;
  memberId?: string;
}

function rangeToDays(range = '30d'): number {
  switch (range) {
    case '7d': return 7;
    case '90d': return 90;
    case 'qtd': {
      const now = new Date();
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return Math.max(7, Math.round((now.getTime() - quarterStart.getTime()) / DAY));
    }
    default: return 30;
  }
}

function pointCount(days: number): number {
  if (days <= 14) return days;
  if (days <= 45) return Math.round(days / 3);
  return Math.round(days / 7);
}

function filterProjects(db: RawDatabase, params: AnalyticsParams): RawProject[] {
  return db.projects.filter((p) => {
    if (params.workspaceId && p.workspaceId !== params.workspaceId) return false;
    if (params.projectId && p.id !== params.projectId) return false;
    if (params.memberId && !p.memberIds.includes(params.memberId)) return false;
    return true;
  });
}

/** Build a deterministic series shaped around a real aggregate `base`. */
function buildSeries(
  key: string,
  label: string,
  base: number,
  seed: number,
  count: number,
  withComparison: boolean,
  comparisonFactor: number,
): Series {
  const rng = createRng(seed);
  const now = Date.now();
  const step = 1;
  const points: TimeSeriesPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const drift = 1 + (rng.next() - 0.45) * 0.4;
    const value = Math.max(0, Math.round(base * drift * 10) / 10);
    const point: TimeSeriesPoint = {
      date: new Date(now - i * step * (7 * DAY) / Math.max(1, count / 4)).toISOString(),
      value,
    };
    if (withComparison) point.comparison = Math.max(0, Math.round(base * drift * comparisonFactor * 10) / 10);
    points.push(point);
  }
  return { key, label, points };
}

function comparisonFactorFor(comparison?: string): number {
  return comparison === 'previous_year' ? 0.82 : 0.92;
}

function kpi(
  id: string,
  label: string,
  value: number,
  format: KpiValue['format'],
  deltaPct: number,
  higherIsBetter: boolean,
  seed: number,
): KpiValue {
  const rng = createRng(seed);
  const sparkline = Array.from({ length: 12 }, () => Math.round(value * (0.8 + rng.next() * 0.4) * 10) / 10);
  return { id, label, value, format, deltaPct, higherIsBetter, sparkline };
}

function coreMetrics(db: RawDatabase, projects: RawProject[]) {
  const derivedProjects = projects.map((p) => deriveProject(db, p));
  const projectIds = new Set(projects.map((p) => p.id));
  const tasks = db.tasks.filter((t) => projectIds.has(t.projectId));

  const activeProjects = derivedProjects.filter((p) => ['active', 'at_risk', 'planning'].includes(p.status)).length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;

  const completed = derivedProjects.filter((p) => p.status === 'completed' && p.completedDate);
  const onTime = completed.filter((p) => new Date(p.completedDate!).getTime() <= new Date(p.targetDate).getTime()).length;
  const onTimePct = completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 92;

  const activeMembers = db.members.filter((m) => m.status === 'active').map((m) => deriveMember(db, m));
  const avgUtil = activeMembers.length
    ? Math.round((activeMembers.reduce((s, m) => s + m.utilization, 0) / activeMembers.length) * 100)
    : 0;

  const totalBudget = derivedProjects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = derivedProjects.reduce((s, p) => s + p.spent, 0);
  const budgetBurn = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return { activeProjects, openTasks, onTimePct, avgUtil, budgetBurn, derivedProjects };
}

export function computeDashboard(db: RawDatabase): DashboardData {
  const m = coreMetrics(db, db.projects);

  const kpis: KpiValue[] = [
    kpi('active_projects', 'Active Projects', m.activeProjects, 'number', 3.1, true, 1),
    kpi('on_time', 'On-time Delivery', m.onTimePct, 'percent', 2.4, true, 2),
    kpi('utilization', 'Team Utilization', m.avgUtil, 'percent', -1.8, false, 3),
    kpi('budget_burn', 'Budget Burn', m.budgetBurn, 'percent', 1.2, false, 4),
    kpi('open_tasks', 'Open Tasks', m.openTasks, 'number', -4.6, false, 5),
  ];

  const distribution = ['planning', 'active', 'at_risk', 'on_hold', 'completed'].map((status) => ({
    status,
    label: status.replace('_', ' '),
    count: m.derivedProjects.filter((p) => p.status === status).length,
  }));

  return {
    kpis,
    velocity: buildSeries('velocity', 'Tasks completed / week', 24, 11, 8, false, 0.9),
    utilization: buildSeries('utilization', 'Avg utilization %', m.avgUtil, 12, 8, false, 0.9),
    distribution,
  };
}

export function computeAnalytics(db: RawDatabase, params: AnalyticsParams): AnalyticsData {
  const projects = filterProjects(db, params);
  const m = coreMetrics(db, projects);
  const days = rangeToDays(params.range);
  const count = pointCount(days);
  const withCmp = Boolean(params.comparison);
  const cf = comparisonFactorFor(params.comparison);

  const kpis: KpiValue[] = [
    kpi('velocity', 'Delivery Velocity', 24, 'number', 5.2, true, 21),
    kpi('on_time', 'On-time Delivery', m.onTimePct, 'percent', 2.4, true, 22),
    kpi('utilization', 'Team Utilization', m.avgUtil, 'percent', -1.8, false, 23),
    kpi('budget_burn', 'Budget Burn', m.budgetBurn, 'percent', 1.2, false, 24),
  ];

  const workspaceName = (id: string) => db.workspaces.find((w) => w.id === id)?.name ?? '—';

  const breakdown = m.derivedProjects.map((p) => {
    const rng = createRng(Number(p.id.replace(/\D/g, '')) || 1);
    return {
      projectId: p.id,
      projectName: p.name,
      workspaceName: workspaceName(p.workspaceId),
      velocity: Math.round((p.taskCount / 6) * (0.7 + rng.next() * 0.6)),
      onTimePct: 70 + rng.int(0, 28),
      utilization: 60 + rng.int(0, 45),
      budgetBurnPct: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0,
    };
  });

  return {
    kpis,
    velocity: buildSeries('velocity', 'Velocity', 22, 31, count, withCmp, cf),
    utilization: buildSeries('utilization', 'Utilization %', m.avgUtil, 32, count, withCmp, cf),
    onTimeDelivery: buildSeries('onTime', 'On-time %', m.onTimePct, 33, count, withCmp, cf),
    budgetBurn: buildSeries('budgetBurn', 'Budget burn %', m.budgetBurn, 34, count, withCmp, cf),
    breakdown,
  };
}
