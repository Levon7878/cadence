import { NavLink, Outlet } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { cn } from '@/shared/lib/cn';
import { usePermissions } from '@/features/rbac';
import type { Permission } from '@/shared/lib/permissions';

interface SettingsLink {
  to: string;
  label: string;
  permission?: Permission;
}

const LINKS: SettingsLink[] = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/appearance', label: 'Appearance' },
  { to: '/settings/notifications', label: 'Notifications' },
  { to: '/settings/security', label: 'Security' },
  { to: '/settings/organization', label: 'Organization', permission: 'settings:organization' },
  { to: '/settings/permissions', label: 'Permissions', permission: 'settings:permissions' },
];

export default function SettingsLayout() {
  const { can } = usePermissions();
  const links = LINKS.filter((l) => !l.permission || can(l.permission));

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account, appearance and organization." />
      <div className="mt-5 grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-base font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-hover hover:text-text',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 max-w-2xl">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
