import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

/**
 * Accessible tab bar (WAI-ARIA tabs pattern) with arrow-key navigation.
 * Controlled — pair with URL/query state for shareable active tab.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + items.length) % items.length;
    onChange(items[next].value);
    tabRefs.current.get(items[next].value)?.focus();
  };

  useEffect(() => {
    const activeTab = tabRefs.current.get(value);
    const list = listRef.current;
    if (!activeTab || !list) return;

    const tabLeft = activeTab.offsetLeft;
    const tabRight = tabLeft + activeTab.offsetWidth;
    const { scrollLeft, clientWidth } = list;

    if (tabLeft < scrollLeft) {
      list.scrollTo({ left: tabLeft, behavior: 'smooth' });
    } else if (tabRight > scrollLeft + clientWidth) {
      list.scrollTo({ left: tabRight - clientWidth, behavior: 'smooth' });
    }
  }, [value]);

  return (
    <div className={cn('min-w-0', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-orientation="horizontal"
        className="flex flex-nowrap gap-0.5 overflow-x-auto border-b border-border scrollbar-none xs:gap-1"
      >
        {items.map((item, index) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              ref={(el) => {
                if (el) tabRefs.current.set(item.value, el);
                else tabRefs.current.delete(item.value);
              }}
              role="tab"
              type="button"
              id={`tab-${item.value}`}
              aria-selected={active}
              aria-controls={`tabpanel-${item.value}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                '-mb-px shrink-0 whitespace-nowrap border-b-2 px-2.5 py-1.5 text-sm font-medium transition-colors',
                'xs:px-3 xs:py-2 xs:text-base',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                active
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-muted hover:text-text',
              )}
            >
              {item.label}
              {item.count != null && (
                <span className="ml-1.5 rounded-full bg-bg-muted px-1.5 text-xs text-text-muted tabular-nums">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
