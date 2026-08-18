import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatCurrency, formatNumber, formatPercent } from '@/shared/lib/format';
import { Card, Skeleton } from '@/shared/ui';
import type { KpiValue } from '@/entities/analytics';
import { Sparkline } from './Sparkline';

function formatValue(kpi: KpiValue): string {
  if (kpi.format === 'percent') return formatPercent(kpi.value, true);
  if (kpi.format === 'currency') return formatCurrency(kpi.value, true);
  return formatNumber(kpi.value);
}

export function KpiCard({ kpi }: { kpi: KpiValue }) {
  const positive = kpi.deltaPct >= 0;
  const good = positive === kpi.higherIsBetter;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="min-w-0 overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-text-muted">{kpi.label}</p>
        <Sparkline data={kpi.sparkline} tone={good ? 'success' : 'danger'} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-text">{formatValue(kpi)}</p>
        <span
          className={cn(
            'mb-0.5 inline-flex items-center gap-0.5 text-sm font-medium',
            good ? 'text-success' : 'text-danger',
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden />
          {Math.abs(kpi.deltaPct).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 text-xs text-text-subtle">vs previous period</p>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </Card>
  );
}
