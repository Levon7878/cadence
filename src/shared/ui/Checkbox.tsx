import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, indeterminate, checked, ...props },
  ref,
) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-base', className)}>
      <span className="relative inline-flex">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer size-4 shrink-0 appearance-none rounded border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50"
          {...props}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-fg opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100">
          {indeterminate ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
        </span>
      </span>
      {label && <span className="select-none text-text">{label}</span>}
    </label>
  );
});
