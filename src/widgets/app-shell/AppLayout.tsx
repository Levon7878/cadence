import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import { useUiStore } from '@/shared/lib/stores/ui-store';
import { IconButton, Portal } from '@/shared/ui';
import { useFocusTrap } from '@/shared/ui/useFocusTrap';
import { CommandPalette } from '@/widgets/command-palette/CommandPalette';
import { Sidebar, SidebarContent } from './Sidebar';
import { Topbar } from './Topbar';

function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const trapRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
        <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Navigation" className="relative h-full w-[min(100%,16rem)] max-w-[85vw] border-r border-border bg-bg-subtle shadow-lg animate-slide-in-right">
          <div className="absolute right-2 top-3">
            <IconButton label="Close navigation" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </div>
          <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </Portal>
  );
}

export function AppLayout() {
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-bg">
      <a href="#main-content" className="sr-only-focusable absolute left-3 top-3 z-[80] rounded-md bg-primary px-3 py-2 text-sm text-primary-fg">
        Skip to content
      </a>
      <Sidebar />
      <MobileNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
