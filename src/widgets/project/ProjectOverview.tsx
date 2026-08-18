import { CheckCircle2, Flag } from 'lucide-react';
import { Card, CardHeader, Progress } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatDate, daysUntil } from '@/shared/lib/format';
import { ProjectHealthBadge, type ProjectDetail } from '@/entities/project';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-text">{value}</p>
      {sub && <p className="text-sm text-text-subtle">{sub}</p>}
    </div>
  );
}

const MILESTONE_TONE = {
  completed: 'success',
  in_progress: 'primary',
  overdue: 'danger',
  upcoming: 'warning',
} as const;

export function ProjectOverview({ project }: { project: ProjectDetail }) {
  const burn = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const days = daysUntil(project.targetDate);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Delivery health" action={<ProjectHealthBadge health={project.health} />} />
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Progress" value={`${project.progress}%`} sub={`${project.taskCount - project.openTaskCount}/${project.taskCount} tasks`} />
            <Stat label="Budget burn" value={`${burn}%`} sub={`${formatCurrency(project.spent, true)} spent`} />
            <Stat label="Open tasks" value={String(project.openTaskCount)} sub={`${project.blockedTaskCount} blocked`} />
            <Stat label="Target" value={days < 0 ? `${Math.abs(days)}d over` : `${days}d left`} sub={formatDate(project.targetDate)} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-text">Why this rating</p>
            <ul className="space-y-1.5">
              {project.healthReasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-base text-text-muted">
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', project.health === 'on_track' ? 'bg-success' : project.health === 'at_risk' ? 'bg-warning' : 'bg-danger')} aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Milestones" />
        <div className="p-4">
          <ul className="space-y-3.5">
            {project.milestones.map((milestone) => (
              <li key={milestone.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-base font-medium text-text">
                    {milestone.status === 'completed' ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Flag className="size-4 text-text-subtle" aria-hidden />}
                    {milestone.name}
                  </span>
                  <span className="text-sm tabular-nums text-text-subtle">{milestone.progress}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Progress value={milestone.progress} tone={MILESTONE_TONE[milestone.status]} className="flex-1" />
                  <span className="w-16 text-right text-xs text-text-subtle">{formatDate(milestone.dueDate)}</span>
                </div>
              </li>
            ))}
            {project.milestones.length === 0 && <li className="text-base text-text-subtle">No milestones defined.</li>}
          </ul>
        </div>
      </Card>
    </div>
  );
}
