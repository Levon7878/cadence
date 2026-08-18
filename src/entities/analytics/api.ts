import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toQuery } from '@/shared/api/list-params';
import type { AnalyticsData, DashboardData } from './model/types';

export interface AnalyticsParams {
  range?: string;
  comparison?: string;
  workspaceId?: string;
  projectId?: string;
  memberId?: string;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get('/analytics/dashboard');
  return data as DashboardData;
}

export async function fetchAnalytics(params: AnalyticsParams): Promise<AnalyticsData> {
  const { data } = await apiClient.get(`/analytics/overview${toQuery(params)}`);
  return data as AnalyticsData;
}

export function useDashboardQuery() {
  return useQuery({ queryKey: queryKeys.analytics.dashboard, queryFn: fetchDashboard });
}

export function useAnalyticsQuery(params: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(params),
    queryFn: () => fetchAnalytics(params),
    placeholderData: keepPreviousData,
  });
}
