import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * CSS/JS tooltip that appears on hover and keyboard focus. The trigger element
 * receives `aria-describedby` so assistive tech announces the description.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string; onFocus?: () => void; onBlur?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }>;
  side?: 'top' | 'bottom';
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      {cloneElement(children, {
        'aria-describedby': open ? id : undefined,
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      })}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-xs font-medium text-bg shadow-md animate-fade-in',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
