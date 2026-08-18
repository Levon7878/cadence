import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Avatar, Badge } from '@/shared/ui';
import { formatShortDate, daysUntil } from '@/shared/lib/format';
import { usePermissions } from '@/features/rbac';
import {
  TASK_STATUSES,
  TASK_STATUS_META,
  TaskPriorityBadge,
  useUpdateTaskStatus,
  type Task,
  type TaskStatus,
} from '@/entities/task';

function TaskCard({ task, onOpen, draggable, onDragStart }: { task: Task; onOpen: () => void; draggable: boolean; onDragStart: () => void }) {
  const overdue = task.dueDate ? daysUntil(task.dueDate) < 0 : false;
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-surface p-3 text-left shadow-xs transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <p className="text-base font-medium text-text">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority} />
        {task.labels.slice(0, 1).map((label) => (
          <Badge key={label} tone="neutral">{label}</Badge>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {task.dueDate ? (
          <span className={cn('text-xs', overdue ? 'text-danger' : 'text-text-subtle')}>{formatShortDate(task.dueDate)}</span>
        ) : (
          <span className="text-xs text-text-subtle">No due date</span>
        )}
        {task.assignee ? <Avatar name={task.assignee.name} size="xs" /> : <span className="size-5 rounded-full border border-dashed border-border-strong" aria-label="Unassigned" />}
      </div>
    </div>
  );
}

export function TaskBoard({ projectId, tasks, onOpenTask }: { projectId: string; tasks: Task[]; onOpenTask: (id: string) => void }) {
  const { can } = usePermissions();
  const updateStatus = useUpdateTaskStatus();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const canDrag = can('task:edit');

  const onDrop = (status: TaskStatus) => {
    setOverColumn(null);
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    if (!can('task:edit', { ownerId: task.assignee?.id })) return;
    updateStatus.mutate({ id: task.id, status, projectId });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status);
        const meta = TASK_STATUS_META[status];
        return (
          <div
            key={status}
            onDragOver={(e) => {
              if (!canDrag) return;
              e.preventDefault();
              setOverColumn(status);
            }}
            onDrop={() => onDrop(status)}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-lg border bg-bg-subtle',
              overColumn === status ? 'border-primary' : 'border-border',
            )}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
              </div>
              <span className="text-sm tabular-nums text-text-subtle">{columnTasks.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable={canDrag}
                  onDragStart={() => setDragId(task.id)}
                  onOpen={() => onOpenTask(task.id)}
                />
              ))}
              {columnTasks.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-text-subtle">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
