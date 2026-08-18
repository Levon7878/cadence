import { Activity as ActivityIcon } from 'lucide-react';
import { Avatar, EmptyState, Skeleton } from '@/shared/ui';
import { formatRelativeTime } from '@/shared/lib/format';
import { describeActivity, type Activity } from '@/entities/activity';

export function ActivityFeed({ items, loading }: { items?: Activity[]; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex gap-3">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!items || items.length === 0) {
    return <EmptyState icon={ActivityIcon} title="No activity yet" description="Actions across your workspace will appear here." />;
  }

  return (
    <ul className="space-y-4">
      {items.map((activity) => (
        <li key={activity.id} className="flex gap-3">
          <Avatar name={activity.actor.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-base text-text">
              <span className="font-medium">{activity.actor.name}</span>{' '}
              <span className="text-text-muted">{describeActivity(activity)}</span>
            </p>
            <p className="text-sm text-text-subtle">{formatRelativeTime(activity.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
