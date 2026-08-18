import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldProps } from './Field';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, invalid, ...props },
  ref,
) {
  const fieldProps = useFieldProps();
  const isInvalid = invalid || Boolean(fieldProps['aria-invalid']);
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle [&_svg]:size-4">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-md border bg-surface px-3 text-base text-text transition-colors',
          'placeholder:text-text-subtle',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-strong',
          leftIcon && 'pl-9',
          className,
        )}
        {...fieldProps}
        {...props}
      />
    </div>
  );
});
