import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Avatar, Badge, Card, Drawer, EmptyState, Select, Skeleton } from '@/shared/ui';
import { formatPercent } from '@/shared/lib/format';
import {
  RoleBadge,
  UtilizationBar,
  utilizationLevel,
  useMemberDirectoryQuery,
  useMemberTasksQuery,
  type Member,
} from '@/entities/member';
import { TaskPriorityBadge, useReassignTask } from '@/entities/task';
import { usePermissions } from '@/features/rbac';

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text">{value}</p>
    </Card>
  );
}

function WorkloadDrawer({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { can } = usePermissions();
  const { data: tasks, isLoading } = useMemberTasksQuery(member?.id);
  const { data: directory } = useMemberDirectoryQuery();
  const reassign = useReassignTask();

  return (
    <Drawer open={member !== null} onClose={onClose} title={member?.user.name ?? 'Member'}>
      {member && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={member.user.name} size="lg" />
            <div>
              <p className="text-base font-medium text-text">{member.title}</p>
              <div className="mt-1"><RoleBadge role={member.role} /></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border p-3 text-center">
            <div><p className="text-sm text-text-muted">Capacity</p><p className="text-lg font-semibold tabular-nums">{member.capacity}h</p></div>
            <div><p className="text-sm text-text-muted">Allocated</p><p className="text-lg font-semibold tabular-nums">{member.allocation}h</p></div>
            <div><p className="text-sm text-text-muted">Utilization</p><p className="text-lg font-semibold tabular-nums">{formatPercent(member.utilization)}</p></div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-text">Active tasks ({tasks?.length ?? 0})</h4>
            {isLoading && <Skeleton className="h-24 w-full" />}
            {!isLoading && tasks && tasks.length === 0 && <p className="text-base text-text-subtle">No active tasks.</p>}
            <ul className="space-y-2">
              {tasks?.map((task) => (
                <li key={task.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/projects/${task.projectId}?task=${task.id}`} className="text-base font-medium text-text hover:underline">{task.title}</Link>
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-sm text-text-subtle">{task.estimateHours}h estimate</span>
                    <Select
                      className="h-8 w-40 text-sm"
                      aria-label={`Reassign ${task.title}`}
                      disabled={!can('task:assign') || reassign.isPending}
                      options={[{ value: '', label: 'Unassigned' }, ...(directory ?? []).map((m) => ({ value: m.id, label: m.user.name }))]}
                      value={member.id}
                      onChange={(e) => {
                        const memberId = e.target.value || null;
                        const assignee = directory?.find((m) => m.id === memberId)?.user;
                        reassign.mutate({ id: task.id, assigneeId: memberId, projectId: task.projectId, assignee });
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function TeamPage() {
  const { data: members, isLoading } = useMemberDirectoryQuery();
  const [selected, setSelected] = useState<Member | null>(null);
  const [filter, setFilter] = useState('');

  const active = (members ?? []).filter((m) => m.status === 'active');
  const shown = filter ? active.filter((m) => utilizationLevel(m.utilization) === filter) : active;
  const avgUtil = active.length ? active.reduce((s, m) => s + m.utilization, 0) / active.length : 0;
  const overAllocated = active.filter((m) => m.utilization > 1).length;

  return (
    <PageContainer>
      <PageHeader title="Team" description="Capacity, allocation and workload across your organization." />

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Active members" value={String(active.length)} />
        <SummaryCard label="Average utilization" value={formatPercent(avgUtil)} />
        <SummaryCard label="Over-allocated" value={String(overAllocated)} />
      </section>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Members</h2>
        <Select
          className="w-44"
          aria-label="Filter by utilization"
          options={[
            { value: '', label: 'All utilization' },
            { value: 'under', label: 'Under-utilized' },
            { value: 'healthy', label: 'Healthy' },
            { value: 'over', label: 'Over-allocated' },
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : shown.length === 0 ? (
          <Card><EmptyState icon={Users} title="No members" description="No members match this filter." /></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelected(member)}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.user.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-text">{member.user.name}</p>
                    <p className="truncate text-sm text-text-muted">{member.title}</p>
                  </div>
                  <RoleBadge role={member.role} />
                </div>
                <div className="flex items-center justify-between">
                  <UtilizationBar utilization={member.utilization} />
                  <Badge tone="neutral">{member.activeTaskCount} tasks</Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <WorkloadDrawer member={selected} onClose={() => setSelected(null)} />
    </PageContainer>
  );
}
