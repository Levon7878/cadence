import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toQuery } from '@/shared/api/list-params';
import type { Paginated } from '@/shared/types/api';
import type { Activity } from './model/types';

export async function fetchActivities(params: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get(`/activities${toQuery(params)}`);
  return data as Paginated<Activity>;
}

export async function fetchProjectActivities(projectId: string, params: { page?: number; pageSize?: number }) {
  const { data } = await apiClient.get(`/projects/${projectId}/activities${toQuery(params)}`);
  return data as Paginated<Activity>;
}

export function useActivitiesQuery(params: { page?: number; pageSize?: number }) {
  return useQuery({ queryKey: queryKeys.activities.list(params), queryFn: () => fetchActivities(params) });
}

export function useProjectActivitiesQuery(projectId: string, params: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: queryKeys.projects.activities(projectId, params),
    queryFn: () => fetchProjectActivities(projectId, params),
    enabled: Boolean(projectId),
  });
}
