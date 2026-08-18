import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CalendarClock, CheckCheck, CreditCard, MessageSquare, UserPlus } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Button, Card, EmptyState, Skeleton, Tabs } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatRelativeTime } from '@/shared/lib/format';
import { useNotificationsQuery, useMarkNotification, useMarkAllNotificationsRead, type NotificationKind } from '@/entities/notification';

const ICONS: Record<NotificationKind, typeof Bell> = {
  mention: MessageSquare,
  assignment: UserPlus,
  risk: AlertTriangle,
  deadline: CalendarClock,
  billing: CreditCard,
  system: Bell,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotificationsQuery();
  const mark = useMarkNotification();
  const markAll = useMarkAllNotificationsRead();
  const [tab, setTab] = useState('all');

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;
  const shown = (data ?? []).filter((n) => (tab === 'unread' ? !n.read : true));

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description="Stay on top of risks, deadlines and mentions."
        actions={
          <Button variant="outline" leftIcon={<CheckCheck className="size-4" />} onClick={() => markAll.mutate()} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        }
      />

      <div className="mt-4 min-w-0 max-w-2xl">
        <Tabs
          items={[
            { value: 'all', label: 'All', count: data?.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
          ]}
          value={tab}
          onChange={setTab}
        />

        <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {!isLoading && shown.length === 0 && (
            <Card><EmptyState icon={Bell} title="You're all caught up" description="No notifications to show here." /></Card>
          )}
          <ul className="space-y-2">
            {shown.map((n) => {
              const Icon = ICONS[n.kind];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) mark.mutate({ id: n.id, read: true });
                      if (n.href) navigate(n.href);
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-border-strong',
                      n.read ? 'border-border bg-surface' : 'border-primary/30 bg-primary/5',
                    )}
                  >
                    <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-bg-muted text-text-muted' : 'bg-primary/10 text-primary')}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium text-text">{n.title}</p>
                        {!n.read && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                      </div>
                      <p className="text-base text-text-muted">{n.body}</p>
                      <p className="mt-0.5 text-sm text-text-subtle">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
