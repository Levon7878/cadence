import { Badge } from '@/shared/ui';
import { TASK_PRIORITY_META, TASK_STATUS_META, type TaskPriority, type TaskStatus } from '../model/types';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = TASK_PRIORITY_META[priority];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
