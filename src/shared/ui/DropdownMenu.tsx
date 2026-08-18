import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useClickOutside } from './useClickOutside';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

/**
 * Accessible dropdown menu (WAI-ARIA menu pattern) with keyboard navigation.
 * `trigger` receives props to spread onto the triggering element.
 */
export function DropdownMenu({
  trigger,
  items,
  align = 'end',
}: {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; ref: React.Ref<HTMLButtonElement> }) => ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useClickOutside(containerRef, () => setOpen(false), open);

  const enabledIndexes = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const openMenu = () => {
    setOpen(true);
    setActiveIndex(enabledIndexes[0] ?? 0);
    requestAnimationFrame(() => itemRefs.current[enabledIndexes[0] ?? 0]?.focus());
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (dir: 1 | -1) => {
    const pos = enabledIndexes.indexOf(activeIndex);
    const next = enabledIndexes[(pos + dir + enabledIndexes.length) % enabledIndexes.length];
    setActiveIndex(next);
    itemRefs.current[next]?.focus();
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {trigger({
        onClick: () => (open ? setOpen(false) : openMenu()),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        ref: triggerRef,
      })}
      {open && (
        <div
          role="menu"
          tabIndex={-1}
          className={cn(
            'absolute z-40 mt-1 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-popover animate-scale-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
            else if (event.key === 'Escape') { event.preventDefault(); close(); }
          }}
        >
          {items.map((item, index) => (
            <div key={item.label}>
              {item.separatorBefore && <div className="my-1 h-px bg-border" role="separator" />}
              <button
                ref={(el) => { itemRefs.current[index] = el; }}
                role="menuitem"
                type="button"
                tabIndex={index === activeIndex ? 0 : -1}
                disabled={item.disabled}
                onClick={() => { item.onSelect?.(); close(); }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-base transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-40',
                  item.danger
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-text hover:bg-surface-hover',
                )}
              >
                {item.icon && <span className="text-text-subtle [&_svg]:size-4">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
