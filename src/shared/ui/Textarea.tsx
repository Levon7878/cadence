import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldProps } from './Field';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    const fieldProps = useFieldProps();
    const isInvalid = Boolean(fieldProps['aria-invalid']);
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-20 w-full rounded-md border bg-surface px-3 py-2 text-base text-text transition-colors',
          'placeholder:text-text-subtle resize-y',
          'focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isInvalid ? 'border-danger focus-visible:ring-danger' : 'border-border hover:border-border-strong',
          className,
        )}
        {...fieldProps}
        {...props}
      />
    );
  },
);
