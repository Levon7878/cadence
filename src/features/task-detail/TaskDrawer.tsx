import { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar, Button, Drawer, Field, Select, Skeleton, Textarea } from '@/shared/ui';
import { formatDate, formatRelativeTime } from '@/shared/lib/format';
import { usePermissions } from '@/features/rbac';
import { useMemberDirectoryQuery } from '@/entities/member';
import {
  TASK_STATUSES,
  TASK_STATUS_META,
  TaskPriorityBadge,
  useAddComment,
  useReassignTask,
  useTaskQuery,
  useUpdateTaskStatus,
} from '@/entities/task';

export function TaskDrawer({ taskId, projectId, onClose }: { taskId: string | null; projectId: string; onClose: () => void }) {
  const { can } = usePermissions();
  const { data: task, isLoading } = useTaskQuery(taskId ?? undefined);
  const { data: directory } = useMemberDirectoryQuery();
  const updateStatus = useUpdateTaskStatus();
  const reassign = useReassignTask();
  const addComment = useAddComment(taskId ?? '', projectId);
  const [comment, setComment] = useState('');

  const ownerCtx = { ownerId: task?.assignee?.id };
  const canEdit = can('task:edit', ownerCtx);
  const canAssign = can('task:assign', ownerCtx);

  const submitComment = async () => {
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment.trim());
    setComment('');
  };

  return (
    <Drawer open={taskId !== null} onClose={onClose} title="Task details" width="max-w-lg">
      {isLoading || !task ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-text">{task.title}</h3>
            <p className="mt-1 text-base text-text-muted">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select
                options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_META[s].label }))}
                value={task.status}
                disabled={!canEdit || updateStatus.isPending}
                onChange={(e) => updateStatus.mutate({ id: task.id, status: e.target.value as never, projectId })}
              />
            </Field>
            <Field label="Assignee">
              <Select
                options={[{ value: '', label: 'Unassigned' }, ...(directory ?? []).map((m) => ({ value: m.id, label: m.user.name }))]}
                value={directory?.find((m) => m.user.id === task.assignee?.id)?.id ?? ''}
                disabled={!canAssign || reassign.isPending}
                onChange={(e) => {
                  const memberId = e.target.value || null;
                  const assignee = directory?.find((m) => m.id === memberId)?.user;
                  reassign.mutate({ id: task.id, assigneeId: memberId, projectId, assignee });
                }}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-subtle">Priority</span>
              <TaskPriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-subtle">Estimate</span>
              <span className="text-text">{task.estimateHours}h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-subtle">Logged</span>
              <span className="text-text">{task.loggedHours}h</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <span className="text-text-subtle">Due</span>
                <span className="text-text">{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-text">Comments ({task.comments.length})</h4>
            <ul className="space-y-3">
              {task.comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author.name} size="sm" />
                  <div className="min-w-0 flex-1 rounded-lg bg-bg-subtle px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-text">{c.author.name}</span>
                      <span className="text-xs text-text-subtle">{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-base text-text-muted">{c.body}</p>
                  </div>
                </li>
              ))}
              {task.comments.length === 0 && <li className="text-base text-text-subtle">No comments yet.</li>}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Add a comment"
                rows={2}
              />
              <div className="flex justify-end">
                <Button size="sm" leftIcon={<Send className="size-4" />} onClick={submitComment} loading={addComment.isPending} disabled={!comment.trim()}>
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
