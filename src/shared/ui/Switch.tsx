import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, label, ...props },
  ref,
) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}>
      <span className="relative inline-flex">
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span className="h-5 w-9 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-4" />
      </span>
      {label && <span className="select-none text-base text-text">{label}</span>}
    </label>
  );
});
