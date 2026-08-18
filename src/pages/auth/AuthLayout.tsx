import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '@/shared/config/constants';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-y-auto overflow-x-hidden bg-bg-subtle">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-fg">
              <svg viewBox="0 0 32 32" className="size-5" aria-hidden>
                <path d="M9 20.5V11.5M9 11.5L16 16L9 20.5M16 11.5V20.5M16 16L23 11.5V20.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-text">{APP_NAME}</span>
          </div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          <p className="mb-6 mt-1 text-md text-text-muted">{subtitle}</p>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">{children}</div>
          {footer && <div className="mt-4 text-center text-base text-text-muted">{footer}</div>}
        </div>
      </div>
      <footer className="py-6 text-center text-sm text-text-subtle">
        <p>
          A portfolio project. See{' '}
          <Link to="/login" className="underline hover:text-text-muted">
            the README
          </Link>{' '}
          for architecture notes.
        </p>
      </footer>
    </div>
  );
}
