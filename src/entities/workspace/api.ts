import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { Organization, Workspace } from './model/types';

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data } = await apiClient.get('/workspaces');
  return data as Workspace[];
}

export async function fetchOrganization(): Promise<Organization> {
  const { data } = await apiClient.get('/organizations/me');
  return data as Organization;
}

export function useWorkspacesQuery() {
  return useQuery({ queryKey: queryKeys.workspaces, queryFn: fetchWorkspaces, staleTime: 5 * 60_000 });
}

export function useOrganizationQuery() {
  return useQuery({ queryKey: queryKeys.organization, queryFn: fetchOrganization, staleTime: 5 * 60_000 });
}
