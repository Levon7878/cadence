import { FlaskConical } from 'lucide-react';
import { env } from '@/shared/config/env';
import { ROLES, ROLE_META, type Role } from '@/shared/lib/permissions';
import { DropdownMenu } from '@/shared/ui';
import { useSessionStore } from '@/entities/session';
import { useDemoRoleStore } from '../model/demo-role-store';

/**
 * DEV-ONLY role switcher. Tree-shaken from production builds via `env.isDev`
 * guard (and the component returns null in prod as a defense-in-depth double
 * check). Lets reviewers experience every role without extra accounts.
 */
export function RoleSwitcher() {
  const sessionRole = useSessionStore((s) => s.user?.role);
  const override = useDemoRoleStore((s) => s.overrideRole);
  const setOverride = useDemoRoleStore((s) => s.setOverrideRole);

  if (!env.isDev) return null;

  const effective = override ?? sessionRole ?? 'viewer';
  const label = ROLE_META[effective].label;

  return (
    <DropdownMenu
      align="end"
      trigger={(props) => (
        <button
          type="button"
          aria-label={`Demo role: ${label}`}
          className="inline-flex size-8 shrink-0 items-center justify-center gap-1 rounded-md border border-warning/40 bg-warning/10 text-xs font-medium text-warning transition-[width,padding] duration-200 hover:bg-warning/15 focus-visible:ring-2 focus-visible:ring-ring xs:h-9 xs:w-auto xs:px-2 xs:py-1"
          {...props}
        >
          <FlaskConical className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden max-w-[5rem] truncate xs:inline sm:max-w-none">
            <span className="hidden sm:inline">Demo role: </span>
            {label}
          </span>
        </button>
      )}
      items={[
        {
          label: `Use my real role (${sessionRole ? ROLE_META[sessionRole].label : '—'})`,
          onSelect: () => setOverride(null),
        },
        ...ROLES.map((role: Role) => ({
          label: ROLE_META[role].label,
          onSelect: () => setOverride(role),
          separatorBefore: role === 'owner',
        })),
      ]}
    />
  );
}
