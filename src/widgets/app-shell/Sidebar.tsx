import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { APP_NAME } from '@/shared/config/constants';
import { useUiStore } from '@/shared/lib/stores/ui-store';
import { Tooltip } from '@/shared/ui';
import { usePermissions } from '@/features/rbac';
import { useOrganizationQuery } from '@/entities/workspace';
import { NAV_GROUPS } from './nav-config';

function Logo({ collapsed }: { collapsed: boolean }) {
  const { data: org } = useOrganizationQuery();
  return (
    <div className="flex h-14 items-center gap-2.5 px-4">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg">
        <svg viewBox="0 0 32 32" className="size-4" aria-hidden>
          <path d="M9 20.5V11.5M9 11.5L16 16L9 20.5M16 11.5V20.5M16 16L23 11.5V20.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-md font-semibold text-text">{APP_NAME}</p>
          <p className="truncate text-xs text-text-muted">{org?.name ?? 'Loading…'}</p>
        </div>
      )}
    </div>
  );
}

export function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { can } = usePermissions();

  return (
    <div className="flex h-full flex-col">
      <Logo collapsed={collapsed} />
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3 scrollbar-thin" aria-label="Primary">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.permission || can(item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const link = (
                    <NavLink
                      to={item.to}
                      end={!item.matchPrefix}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-base font-medium transition-colors',
                          collapsed && 'justify-center',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:bg-surface-hover hover:text-text',
                        )
                      }
                    >
                      <item.icon className="size-[18px] shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                  return (
                    <li key={item.to}>
                      {collapsed ? <Tooltip content={item.label} side="bottom">{link}</Tooltip> : link}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border bg-bg-subtle transition-[width] lg:flex lg:flex-col',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text',
            collapsed && 'justify-center',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
