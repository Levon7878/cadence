import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/shared/ui';
import { formatShortDate } from '@/shared/lib/format';
import type { DashboardData } from '@/entities/analytics';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const tooltipStyle = {
  background: 'hsl(var(--surface))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--text))',
};

export function VelocityChart({ data, loading, error, onRetry }: { data?: DashboardData['velocity']; loading?: boolean; error?: boolean; onRetry?: () => void }) {
  const points = data?.points ?? [];
  const summary = data
    ? `${data.label}. ${points.length} data points ranging from ${Math.min(...points.map((p) => p.value))} to ${Math.max(...points.map((p) => p.value))}.`
    : 'Loading velocity data.';
  return (
    <ChartCard title="Delivery velocity" description="Tasks completed per week" summary={summary} loading={loading} error={error} onRetry={onRetry}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(d) => formatShortDate(d)} tick={{ fontSize: 11, fill: 'hsl(var(--text-subtle))' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--text-subtle))' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => formatShortDate(d as string)} />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#velocityFill)" name="Completed" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DistributionChart({ data, loading, error, onRetry }: { data?: DashboardData['distribution']; loading?: boolean; error?: boolean; onRetry?: () => void }) {
  const slices = (data ?? []).filter((d) => d.count > 0);
  const summary = data ? `Projects by status: ${slices.map((s) => `${s.count} ${s.label}`).join(', ')}.` : 'Loading distribution.';
  return (
    <ChartCard title="Project distribution" description="By current status" summary={summary} loading={loading} error={error} onRetry={onRetry}>
      <div className="flex h-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="h-36 w-full shrink-0 sm:h-full sm:w-[55%]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="count" nameKey="label" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="none">
                {slices.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {slices.map((slice, i) => (
            <li key={slice.status} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} aria-hidden />
              <span className="flex-1 capitalize text-text-muted">{slice.label}</span>
              <span className="font-medium tabular-nums text-text">{slice.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
