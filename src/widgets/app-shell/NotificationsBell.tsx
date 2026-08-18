import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationsQuery } from '@/entities/notification';

export function NotificationsBell() {
  const navigate = useNavigate();
  const { data } = useNotificationsQuery();
  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate('/notifications')}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:ring-2 focus-visible:ring-ring xs:size-9"
    >
      <Bell className="size-[18px]" aria-hidden />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-fg xs:right-1.5 xs:top-1.5">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
