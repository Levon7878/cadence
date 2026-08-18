import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { ROLE_META, type Role } from '@/shared/lib/permissions';

export function RoleBadge({ role }: { role: Role }) {
  const tone = role === 'owner' ? 'primary' : role === 'admin' ? 'info' : 'neutral';
  return <Badge tone={tone}>{ROLE_META[role].label}</Badge>;
}

export type UtilizationLevel = 'under' | 'healthy' | 'over';

export function utilizationLevel(utilization: number): UtilizationLevel {
  if (utilization > 1) return 'over';
  if (utilization < 0.5) return 'under';
  return 'healthy';
}

const LEVEL_META: Record<UtilizationLevel, { label: string; bar: string; text: string }> = {
  under: { label: 'Under-utilized', bar: 'bg-info', text: 'text-info' },
  healthy: { label: 'Healthy', bar: 'bg-success', text: 'text-success' },
  over: { label: 'Over-allocated', bar: 'bg-danger', text: 'text-danger' },
};

/** Visual utilization indicator that can exceed 100% (over-allocation). */
export function UtilizationBar({ utilization, className }: { utilization: number; className?: string }) {
  const level = utilizationLevel(utilization);
  const meta = LEVEL_META[level];
  const pct = Math.round(utilization * 100);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-muted" role="img" aria-label={`${pct}% utilized, ${meta.label}`}>
        <div className={cn('h-full rounded-full', meta.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className={cn('text-sm font-medium tabular-nums', meta.text)}>{pct}%</span>
    </div>
  );
}
