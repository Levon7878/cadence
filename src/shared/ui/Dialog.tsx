import { useId } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Portal } from './Portal';
import { IconButton } from './IconButton';
import { useFocusTrap } from './useFocusTrap';
import { useLockBodyScroll } from './useLockBodyScroll';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** On small screens, render as a bottom sheet instead of a centered modal. Defaults to centered. */
  mobileSheet?: boolean;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  mobileSheet = false,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <Portal>
      <div
        className={cn(
          'fixed inset-0 z-50 flex justify-center px-4',
          mobileSheet ? 'items-end sm:items-center sm:px-0' : 'items-center py-8 sm:py-0 sm:px-0',
        )}
      >
        <div
          className="absolute inset-0 bg-black/40 animate-fade-in"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className={cn(
            'relative z-10 flex max-h-[90vh] w-full flex-col border border-border bg-surface shadow-lg',
            'animate-scale-in',
            mobileSheet ? 'rounded-t-xl sm:rounded-xl' : 'rounded-xl',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-text">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-base text-text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close dialog" onClick={onClose} className="-mr-1">
              <X className="size-4" aria-hidden />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
