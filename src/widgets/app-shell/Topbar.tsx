import { Menu, Search } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui';
import { useUiStore } from '@/shared/lib/stores/ui-store';
import { RoleSwitcher } from '@/features/rbac';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsBell } from './NotificationsBell';

export function Topbar() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 shrink-0 items-center gap-1 border-b border-border bg-bg/80 px-2 backdrop-blur transition-[padding,gap] duration-200 xs:gap-1.5 xs:px-3 sm:gap-2 sm:px-4">
      <IconButton
        label="Open navigation"
        size="sm"
        className="shrink-0 lg:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="size-5" />
      </IconButton>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Search or jump to"
        className={cn(
          'flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-sm text-text-subtle transition-[width,padding,gap] duration-200 hover:border-border-strong',
          'size-8 xs:h-9 xs:min-w-0 xs:w-auto xs:flex-1 xs:justify-start xs:gap-2 xs:px-3 xs:max-w-none sm:max-w-xs sm:min-w-48 md:min-w-64',
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-left xs:block">
          <span className="sm:hidden">Search…</span>
          <span className="hidden sm:inline">Search or jump to…</span>
        </span>
        <kbd className="hidden shrink-0 rounded border border-border bg-bg-muted px-1.5 py-0.5 text-xs font-medium text-text-muted md:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 xs:gap-1 sm:gap-2">
        <RoleSwitcher />
        <NotificationsBell />
        <ThemeToggle />
        <div className="mx-0.5 hidden h-6 w-px bg-border sm:mx-1 sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
