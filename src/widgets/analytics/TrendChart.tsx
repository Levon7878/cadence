import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/shared/ui';
import { formatShortDate } from '@/shared/lib/format';
import type { Series } from '@/entities/analytics';

const tooltipStyle = {
  background: 'hsl(var(--surface))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--text))',
};

export function TrendChart({
  title,
  description,
  series,
  loading,
  error,
  onRetry,
  hasComparison,
}: {
  title: string;
  description?: string;
  series?: Series;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  hasComparison?: boolean;
}) {
  const points = series?.points ?? [];
  const values = points.map((p) => p.value);
  const summary = series
    ? `${title}: ${points.length} points, current ${values[values.length - 1] ?? 0}, average ${values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0}.`
    : 'Loading chart.';

  return (
    <ChartCard title={title} description={description} summary={summary} loading={loading} error={error} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => formatShortDate(d)} tick={{ fontSize: 11, fill: 'hsl(var(--text-subtle))' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-subtle))' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => formatShortDate(d as string)} />
          {hasComparison && <Line type="monotone" dataKey="comparison" stroke="hsl(var(--text-subtle))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Comparison" />}
          <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name={series?.label ?? 'Value'} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
