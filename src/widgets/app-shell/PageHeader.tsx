import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '@/shared/ui';

/** Standard page header: breadcrumbs, title, description and a primary action. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 xs:flex-row xs:items-end xs:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-1.5 min-w-0">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-text xs:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-base text-text-muted xs:text-md">{description}</p>}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 xs:w-auto xs:shrink-0 xs:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

/** Consistent page content padding container. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-4 xs:px-4 xs:py-5 sm:px-6 lg:py-6">{children}</div>;
}
