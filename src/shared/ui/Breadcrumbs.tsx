import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm text-text-muted scrollbar-none">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {item.to && !isLast ? (
                  <Link to={item.to} className="rounded hover:text-text">
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-text' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && <ChevronRight className="size-3.5 text-text-subtle" aria-hidden />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
