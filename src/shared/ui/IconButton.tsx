import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name — icon-only buttons must be labelled. */
  label: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline';
  children: ReactNode;
}

const SIZES = { sm: 'size-8', md: 'size-9' } as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', variant = 'ghost', className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-text-muted transition-colors',
        'hover:bg-surface-hover hover:text-text',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'outline' && 'border border-border',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
