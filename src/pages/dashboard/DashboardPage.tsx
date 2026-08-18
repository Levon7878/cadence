import { Card, CardHeader } from '@/shared/ui';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { KpiCard, KpiCardSkeleton } from '@/widgets/kpi/KpiCard';
import { VelocityChart, DistributionChart } from '@/widgets/dashboard/DashboardCharts';
import { AtRiskProjects, UpcomingDeadlines } from '@/widgets/dashboard/RiskAndDeadlines';
import { ActivityFeed } from '@/widgets/activity/ActivityFeed';
import { useDashboardQuery } from '@/entities/analytics';
import { useActivitiesQuery } from '@/entities/activity';
import { useSessionStore } from '@/entities/session';

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useDashboardQuery();
  const activities = useActivitiesQuery({ pageSize: 6 });

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <PageContainer>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="Here's how delivery is tracking across your organization."
      />

      <section aria-label="Key metrics" className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!isLoading && data?.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </section>

      <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <VelocityChart data={data?.velocity} loading={isLoading} error={isError} onRetry={() => refetch()} />
        <DistributionChart data={data?.distribution} loading={isLoading} error={isError} onRetry={() => refetch()} />
      </section>

      <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        <AtRiskProjects />
        <UpcomingDeadlines />
        <Card>
          <CardHeader title="Recent activity" description="Latest across your workspace" />
          <div className="p-4">
            <ActivityFeed items={activities.data?.items} loading={activities.isLoading} />
          </div>
        </Card>
      </section>
    </PageContainer>
  );
}
