import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Avatar, Button, DataTable, ErrorState, Skeleton, Tabs, type Column } from '@/shared/ui';
import { useUrlState } from '@/shared/hooks/useUrlState';
import { formatShortDate } from '@/shared/lib/format';
import { Can } from '@/features/rbac';
import { TaskBoard } from '@/features/task-board/TaskBoard';
import { TaskDrawer } from '@/features/task-detail/TaskDrawer';
import { CreateTaskDialog } from '@/features/task-create/CreateTaskDialog';
import { ProjectOverview } from '@/widgets/project/ProjectOverview';
import { ActivityFeed } from '@/widgets/activity/ActivityFeed';
import { ProjectStatusBadge, ProjectHealthBadge, useProjectQuery } from '@/entities/project';
import { TaskStatusBadge, TaskPriorityBadge, useProjectTasksQuery, type Task } from '@/entities/task';
import { useProjectActivitiesQuery } from '@/entities/activity';
import { useMemberDirectoryQuery, UtilizationBar } from '@/entities/member';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
  { value: 'activity', label: 'Activity' },
  { value: 'members', label: 'Members' },
];

export default function ProjectDetailPage() {
  const { id = '' } = useParams();
  const { get, set } = useUrlState();
  const tab = get('tab') || 'overview';
  const taskId = get('task') || null;
  const [createOpen, setCreateOpen] = useState(false);

  const { data: project, isLoading, isError, refetch } = useProjectQuery(id);
  const tasksQuery = useProjectTasksQuery(id, { pageSize: 200 });
  const activityQuery = useProjectActivitiesQuery(id, { pageSize: 20 });
  const { data: directory } = useMemberDirectoryQuery();

  const openTask = (t: string) => set({ task: t });
  const closeTask = () => set({ task: undefined });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Couldn't load project" description="The project may not exist or an error occurred." onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const tasks = tasksQuery.data?.items ?? [];

  const taskColumns: Column<Task>[] = [
    { id: 'title', header: 'Task', cell: (t) => <span className="font-medium text-text">{t.title}</span> },
    { id: 'status', header: 'Status', cell: (t) => <TaskStatusBadge status={t.status} /> },
    { id: 'priority', header: 'Priority', cell: (t) => <TaskPriorityBadge priority={t.priority} /> },
    { id: 'assignee', header: 'Assignee', cell: (t) => (t.assignee ? <span className="flex items-center gap-2"><Avatar name={t.assignee.name} size="xs" />{t.assignee.name}</span> : <span className="text-text-subtle">Unassigned</span>) },
    { id: 'due', header: 'Due', align: 'right', cell: (t) => <span className="tabular-nums text-text-muted">{t.dueDate ? formatShortDate(t.dueDate) : '—'}</span> },
  ];

  const projectMembers = (directory ?? []).filter((m) => project?.memberIds.includes(m.id));

  return (
    <PageContainer>
      {isLoading || !project ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : (
        <>
          <PageHeader
            title={project.name}
            breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.key }]}
            description={`${project.taskCount} tasks · ${project.progress}% complete`}
            actions={
              <div className="flex items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <ProjectHealthBadge health={project.health} />
                <Can action="task:create">
                  <Button leftIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>New task</Button>
                </Can>
              </div>
            }
          />

          <div className="mt-4 min-w-0">
            <Tabs items={TABS} value={tab} onChange={(v) => set({ tab: v })} />
          </div>

          <div
            role="tabpanel"
            id={`tabpanel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="mt-4 min-w-0"
          >
            {tab === 'overview' && <ProjectOverview project={project} />}

            {tab === 'board' && (
              tasksQuery.isLoading ? <Skeleton className="h-96 w-full" /> : <TaskBoard projectId={id} tasks={tasks} onOpenTask={openTask} />
            )}

            {tab === 'list' && (
              <DataTable
                columns={taskColumns}
                rows={tasks}
                getRowId={(t) => t.id}
                loading={tasksQuery.isLoading}
                onRowClick={(t) => openTask(t.id)}
                caption="Project tasks"
              />
            )}

            {tab === 'activity' && (
              <div className="max-w-2xl rounded-lg border border-border bg-surface p-5">
                <ActivityFeed items={activityQuery.data?.items} loading={activityQuery.isLoading} />
              </div>
            )}

            {tab === 'members' && (
              <div className="overflow-hidden rounded-lg border border-border">
                <ul className="divide-y divide-border">
                  {projectMembers.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 bg-surface px-4 py-3">
                      <Avatar name={member.user.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-text">{member.user.name}</p>
                        <p className="truncate text-sm text-text-muted">{member.title} · {member.activeTaskCount} active tasks</p>
                      </div>
                      <UtilizationBar utilization={member.utilization} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <TaskDrawer taskId={taskId} projectId={id} onClose={closeTask} />
          <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} projectId={id} />
        </>
      )}
    </PageContainer>
  );
}
