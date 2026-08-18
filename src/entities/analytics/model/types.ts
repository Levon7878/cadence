export interface KpiValue {
  id: string;
  label: string;
  /** Formatted display value, computed server-side from seed data. */
  value: number;
  format: 'number' | 'percent' | 'currency';
  /** Percentage change vs the comparison period (e.g. 4.2 = +4.2%). */
  deltaPct: number;
  /** Whether an increase is good (utilization up can be bad, on-time up is good). */
  higherIsBetter: boolean;
  sparkline: number[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  comparison?: number;
}

export interface Series {
  key: string;
  label: string;
  points: TimeSeriesPoint[];
}

export interface ProjectDistributionSlice {
  status: string;
  label: string;
  count: number;
}

export interface DashboardData {
  kpis: KpiValue[];
  velocity: Series;
  utilization: Series;
  distribution: ProjectDistributionSlice[];
}

export interface AnalyticsBreakdownRow {
  projectId: string;
  projectName: string;
  workspaceName: string;
  velocity: number;
  onTimePct: number;
  utilization: number;
  budgetBurnPct: number;
}

export interface AnalyticsData {
  kpis: KpiValue[];
  velocity: Series;
  utilization: Series;
  onTimeDelivery: Series;
  budgetBurn: Series;
  breakdown: AnalyticsBreakdownRow[];
}
