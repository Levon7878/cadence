import { Download } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Button, DataTable, Select, type Column } from '@/shared/ui';
import { useUrlState } from '@/shared/hooks/useUrlState';
import { toCsv, downloadCsv } from '@/shared/lib/csv';
import { formatPercent } from '@/shared/lib/format';
import { toast } from '@/shared/ui/toast';
import { Can, usePermissions } from '@/features/rbac';
import { KpiCard, KpiCardSkeleton } from '@/widgets/kpi/KpiCard';
import { TrendChart } from '@/widgets/analytics/TrendChart';
import { useAnalyticsQuery, type AnalyticsBreakdownRow } from '@/entities/analytics';
import { useWorkspacesQuery } from '@/entities/workspace';

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'qtd', label: 'Quarter to date' },
];

const COMPARISON_OPTIONS = [
  { value: '', label: 'No comparison' },
  { value: 'previous_period', label: 'vs previous period' },
  { value: 'previous_year', label: 'vs previous year' },
];

export default function AnalyticsPage() {
  const { get, set } = useUrlState();
  const { can } = usePermissions();
  const { data: workspaces } = useWorkspacesQuery();

  const params = {
    range: get('range') || '30d',
    comparison: get('comparison') || undefined,
    workspaceId: get('workspaceId') || undefined,
  };

  const { data, isLoading, isError, refetch } = useAnalyticsQuery(params);
  const hasComparison = Boolean(params.comparison);

  const exportCsv = () => {
    if (!can('analytics:export') || !data) return;
    const csv = toCsv<AnalyticsBreakdownRow>(data.breakdown, [
      { header: 'Project', value: (r) => r.projectName },
      { header: 'Workspace', value: (r) => r.workspaceName },
      { header: 'Velocity', value: (r) => r.velocity },
      { header: 'On-time %', value: (r) => r.onTimePct },
      { header: 'Utilization %', value: (r) => r.utilization },
      { header: 'Budget burn %', value: (r) => r.budgetBurnPct },
    ]);
    downloadCsv(`cadence-analytics-${params.range}.csv`, csv);
    toast.success('Export ready', 'Your CSV has been downloaded.');
  };

  const columns: Column<AnalyticsBreakdownRow>[] = [
    { id: 'project', header: 'Project', cell: (r) => <span className="font-medium text-text">{r.projectName}</span> },
    { id: 'workspace', header: 'Workspace', cell: (r) => <span className="text-text-muted">{r.workspaceName}</span> },
    { id: 'velocity', header: 'Velocity', align: 'right', cell: (r) => <span className="tabular-nums">{r.velocity}</span> },
    { id: 'onTime', header: 'On-time', align: 'right', cell: (r) => <span className="tabular-nums">{formatPercent(r.onTimePct, true)}</span> },
    { id: 'utilization', header: 'Utilization', align: 'right', cell: (r) => <span className="tabular-nums">{formatPercent(r.utilization, true)}</span> },
    { id: 'burn', header: 'Budget burn', align: 'right', cell: (r) => <span className="tabular-nums">{formatPercent(r.budgetBurnPct, true)}</span> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Delivery velocity, utilization, on-time performance and budget burn."
        actions={
          <Can action="analytics:export" fallback={<Button variant="outline" leftIcon={<Download className="size-4" />} disabled>Export</Button>}>
            <Button variant="outline" leftIcon={<Download className="size-4" />} onClick={exportCsv} disabled={!data}>Export CSV</Button>
          </Can>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Select className="w-40" options={RANGE_OPTIONS} value={params.range} onChange={(e) => set({ range: e.target.value })} aria-label="Date range" />
        <Select className="w-44" options={COMPARISON_OPTIONS} value={params.comparison ?? ''} onChange={(e) => set({ comparison: e.target.value })} aria-label="Comparison period" />
        <Select className="w-44" options={[{ value: '', label: 'All workspaces' }, ...(workspaces ?? []).map((w) => ({ value: w.id, label: w.name }))]} value={params.workspaceId ?? ''} onChange={(e) => set({ workspaceId: e.target.value })} aria-label="Filter by workspace" />
      </div>

      <section aria-label="Key metrics" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!isLoading && data?.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart title="Delivery velocity" description="Tasks completed" series={data?.velocity} loading={isLoading} error={isError} onRetry={() => refetch()} hasComparison={hasComparison} />
        <TrendChart title="Team utilization" description="Average allocation" series={data?.utilization} loading={isLoading} error={isError} onRetry={() => refetch()} hasComparison={hasComparison} />
        <TrendChart title="On-time delivery" description="Milestones hit on schedule" series={data?.onTimeDelivery} loading={isLoading} error={isError} onRetry={() => refetch()} hasComparison={hasComparison} />
        <TrendChart title="Budget burn" description="Spend against budget" series={data?.budgetBurn} loading={isLoading} error={isError} onRetry={() => refetch()} hasComparison={hasComparison} />
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-semibold text-text">Project breakdown</h2>
        <DataTable columns={columns} rows={data?.breakdown ?? []} getRowId={(r) => r.projectId} loading={isLoading} error={isError} onRetry={() => refetch()} caption="Analytics breakdown by project" />
      </section>
    </PageContainer>
  );
}
