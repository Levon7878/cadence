import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { Card, CardHeader, EmptyState, Progress, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { daysUntil, formatDate } from '@/shared/lib/format';
import { ProjectHealthBadge, useProjectsQuery, type Project } from '@/entities/project';

function useDashboardProjects() {
  return useProjectsQuery({ pageSize: 100 });
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function AtRiskProjects() {
  const { data, isLoading, isError } = useDashboardProjects();
  const projects = (data?.items ?? [])
    .filter((p) => p.health !== 'on_track' && p.status !== 'completed')
    .sort((a, b) => (a.health === 'off_track' ? -1 : 1) - (b.health === 'off_track' ? -1 : 1))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader title="At-risk projects" description="Health is trending down" />
      <div className="px-4 py-1">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
        {!isLoading && !isError && projects.length === 0 && (
          <EmptyState icon={AlertTriangle} title="Everything on track" description="No projects are currently at risk." />
        )}
        {!isLoading &&
          projects.map((project: Project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0 hover:opacity-80">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-text">{project.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={project.progress} tone={project.health === 'off_track' ? 'danger' : 'warning'} className="w-28" />
                  <span className="text-xs text-text-muted">{project.progress}%</span>
                </div>
              </div>
              <ProjectHealthBadge health={project.health} />
            </Link>
          ))}
      </div>
    </Card>
  );
}

export function UpcomingDeadlines() {
  const { data, isLoading, isError } = useDashboardProjects();
  const projects = (data?.items ?? [])
    .filter((p) => p.status !== 'completed' && p.status !== 'archived')
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader title="Upcoming deadlines" description="Nearest project target dates" />
      <div className="px-4 py-1">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}
        {!isLoading && !isError && projects.length === 0 && (
          <EmptyState icon={CalendarClock} title="No deadlines" description="No active project deadlines." />
        )}
        {!isLoading &&
          projects.map((project) => {
            const days = daysUntil(project.targetDate);
            const overdue = days < 0;
            return (
              <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0 hover:opacity-80">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-text">{project.name}</p>
                  <p className="text-sm text-text-muted">{formatDate(project.targetDate)}</p>
                </div>
                <span className={cn('shrink-0 text-sm font-medium tabular-nums', overdue ? 'text-danger' : days <= 7 ? 'text-warning' : 'text-text-muted')}>
                  {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                </span>
              </Link>
            );
          })}
      </div>
    </Card>
  );
}
