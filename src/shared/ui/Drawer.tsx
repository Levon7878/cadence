import { useId } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Portal } from './Portal';
import { IconButton } from './IconButton';
import { useFocusTrap } from './useFocusTrap';
import { useLockBodyScroll } from './useLockBodyScroll';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: string;
}

export function Drawer({ open, onClose, title, children, footer, side = 'right', width = 'max-w-md' }: DrawerProps) {
  const titleId = useId();
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} aria-hidden />
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            'relative z-10 ml-auto flex h-full w-full flex-col border-border bg-surface shadow-lg animate-slide-in-right',
            width,
            side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {title}
            </h2>
            <IconButton label="Close panel" onClick={onClose} className="-mr-1">
              <X className="size-4" aria-hidden />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}
