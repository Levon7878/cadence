import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ShieldOff, Compass } from 'lucide-react';
import { Button } from '@/shared/ui';

function ErrorScreen({
  code,
  title,
  description,
  icon,
}: {
  code: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-bg-muted text-text-muted">{icon}</div>
      <p className="text-sm font-semibold uppercase tracking-wide text-text-subtle">Error {code}</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">{title}</h1>
      <p className="mt-2 max-w-md text-md text-text-muted">{description}</p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Back to dashboard
      </Button>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <ErrorScreen
      code="403"
      title="Access denied"
      description="You don't have permission to view this page. If you think this is a mistake, contact an administrator or switch roles using the demo role switcher."
      icon={<ShieldOff className="size-7" aria-hidden />}
    />
  );
}

export function NotFoundPage() {
  return (
    <ErrorScreen
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved."
      icon={<Compass className="size-7" aria-hidden />}
    />
  );
}
