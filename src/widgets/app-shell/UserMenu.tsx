import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, DropdownMenu } from '@/shared/ui';
import { ROLE_META } from '@/shared/lib/permissions';
import { useSessionStore } from '@/entities/session';

export function UserMenu() {
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!user) return null;

  const logout = () => {
    clear();
    qc.clear();
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu
      align="end"
      trigger={(props) => (
        <button
          type="button"
          className="flex size-8 shrink-0 items-center gap-2 rounded-md p-0.5 transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring xs:h-9 xs:w-auto xs:pr-1.5"
          {...props}
        >
          <Avatar name={user.name} size="sm" />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-text">{user.name}</span>
            <span className="block text-xs leading-tight text-text-muted">{ROLE_META[user.role].label}</span>
          </span>
        </button>
      )}
      items={[
        { label: 'Profile', icon: <User />, onSelect: () => navigate('/settings/profile') },
        { label: 'Settings', icon: <Settings />, onSelect: () => navigate('/settings') },
        { label: 'Sign out', icon: <LogOut />, danger: true, separatorBefore: true, onSelect: logout },
      ]}
    />
  );
}
