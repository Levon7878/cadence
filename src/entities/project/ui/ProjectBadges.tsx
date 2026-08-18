import { Badge } from '@/shared/ui';
import { PROJECT_HEALTH_META, PROJECT_STATUS_META, type ProjectHealth, type ProjectStatus } from '../model/types';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function ProjectHealthBadge({ health }: { health: ProjectHealth }) {
  const meta = PROJECT_HEALTH_META[health];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
