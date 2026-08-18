import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FolderKanban, Search } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useUiStore } from '@/shared/lib/stores/ui-store';
import { Avatar, Portal } from '@/shared/ui';
import { useFocusTrap } from '@/shared/ui/useFocusTrap';
import { usePermissions } from '@/features/rbac';
import { useProjectsQuery } from '@/entities/project';
import { useMemberDirectoryQuery } from '@/entities/member';
import { NAV_GROUPS } from '@/widgets/app-shell/nav-config';
import type { ReactNode } from 'react';

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  icon: ReactNode;
  perform: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebouncedValue(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  // Global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const hasQuery = debounced.trim().length > 0;
  const { data: projectResults } = useProjectsQuery({ search: debounced, pageSize: 5 });
  const { data: directory } = useMemberDirectoryQuery();

  const commands = useMemo<Command[]>(() => {
    const q = debounced.trim().toLowerCase();
    const nav: Command[] = NAV_GROUPS.flatMap((g) => g.items)
      .filter((item) => !item.permission || can(item.permission))
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .map((item) => ({
        id: `nav-${item.to}`,
        label: item.label,
        group: 'Navigation',
        icon: <item.icon className="size-4" />,
        perform: () => navigate(item.to),
      }));

    const projects: Command[] = hasQuery
      ? (projectResults?.items ?? []).map((p) => ({
          id: `prj-${p.id}`,
          label: p.name,
          sublabel: p.key,
          group: 'Projects',
          icon: <FolderKanban className="size-4" />,
          perform: () => navigate(`/projects/${p.id}`),
        }))
      : [];

    const members: Command[] = hasQuery
      ? (directory ?? [])
          .filter((m) => m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q))
          .slice(0, 5)
          .map((m) => ({
            id: `mem-${m.id}`,
            label: m.user.name,
            sublabel: m.title,
            group: 'People',
            icon: <Avatar name={m.user.name} size="xs" />,
            perform: () => navigate('/team'),
          }))
      : [];

    return [...nav, ...projects, ...members];
  }, [debounced, hasQuery, projectResults, directory, can, navigate]);

  useEffect(() => setActive(0), [debounced]);

  if (!open) return null;

  const run = (cmd: Command) => {
    cmd.perform();
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && commands[active]) {
      e.preventDefault();
      run(commands[active]);
    }
  };

  let lastGroup = '';

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
        <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} aria-hidden />
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-scale-in"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4 text-text-subtle" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search projects, people, or jump to…"
              aria-label="Command palette search"
              aria-controls="command-list"
              className="h-12 flex-1 bg-transparent text-md text-text outline-none placeholder:text-text-subtle"
            />
          </div>
          <ul ref={listRef} id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            {commands.length === 0 && (
              <li className="px-3 py-8 text-center text-base text-text-muted">No results for “{debounced}”.</li>
            )}
            {commands.map((cmd, index) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <li key={cmd.id}>
                  {showGroup && (
                    <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">{cmd.group}</p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(cmd)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-base transition-colors',
                      index === active ? 'bg-primary/10 text-text' : 'text-text-muted',
                    )}
                  >
                    <span className="text-text-subtle">{cmd.icon}</span>
                    <span className="flex-1 truncate text-text">{cmd.label}</span>
                    {cmd.sublabel && <span className="truncate text-sm text-text-subtle">{cmd.sublabel}</span>}
                    {index === active && <CornerDownLeft className="size-3.5 text-text-subtle" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Portal>
  );
}
