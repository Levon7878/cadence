import { z } from 'zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, isApiError } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toQuery } from '@/shared/api/list-params';
import { paginatedSchema, userSummarySchema } from '@/shared/lib/schemas';
import { toast } from '@/shared/ui/toast';
import { ROLES, type Role } from '@/shared/lib/permissions';
import type { Member } from './model/types';
import type { Task } from '@/entities/task/model/types';

const memberSchema = z.object({
  id: z.string(),
  user: userSummarySchema,
  role: z.enum(ROLES),
  status: z.enum(['active', 'invited', 'deactivated']),
  title: z.string(),
  capacity: z.number(),
  allocation: z.number(),
  utilization: z.number(),
  activeTaskCount: z.number(),
  workspaceIds: z.array(z.string()),
  joinedAt: z.string(),
});

export interface MemberListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  workspaceId?: string;
  sort?: string;
  dir?: string;
}

export async function fetchMembers(params: MemberListParams) {
  const { data } = await apiClient.get(`/members${toQuery(params)}`);
  return paginatedSchema(memberSchema).parse(data);
}

export async function fetchMemberDirectory(): Promise<Member[]> {
  const { data } = await apiClient.get('/members?all=true');
  return z.array(memberSchema).parse(data);
}

export function useMembersQuery(params: MemberListParams) {
  return useQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => fetchMembers(params),
    placeholderData: keepPreviousData,
  });
}

export async function fetchMemberTasks(memberId: string): Promise<Task[]> {
  const { data } = await apiClient.get(`/members/${memberId}/tasks`);
  return data as Task[];
}

export function useMemberTasksQuery(memberId: string | undefined) {
  return useQuery({
    queryKey: ['members', memberId, 'tasks'],
    queryFn: () => fetchMemberTasks(memberId!),
    enabled: Boolean(memberId),
  });
}

export function useMemberDirectoryQuery() {
  return useQuery({
    queryKey: queryKeys.members.directory,
    queryFn: fetchMemberDirectory,
    staleTime: 5 * 60_000,
  });
}

export interface InviteMemberBody {
  name: string;
  email: string;
  role: Role;
  workspaceIds: string[];
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteMemberBody) => apiClient.post('/members', body).then((r) => memberSchema.parse(r.data)),
    onSuccess: (member) => {
      toast.success('Invitation sent', `${member.user.name} was invited as ${member.role}.`);
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      apiClient.patch(`/members/${id}`, { role }).then((r) => memberSchema.parse(r.data)),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: queryKeys.members.all });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (error) => toast.error('Could not update role', isApiError(error) ? error.message : undefined),
  });
}

export function useSetMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'deactivated' }) =>
      apiClient.patch(`/members/${id}`, { status }).then((r) => memberSchema.parse(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members.all }),
    onError: (error) => toast.error('Could not update member', isApiError(error) ? error.message : undefined),
  });
}
