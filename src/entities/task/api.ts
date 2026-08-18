import { z } from 'zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toQuery } from '@/shared/api/list-params';
import { paginatedSchema, userSummarySchema } from '@/shared/lib/schemas';
import type { Paginated } from '@/shared/types/api';
import { isApiError } from '@/shared/api/client';
import { toast } from '@/shared/ui/toast';
import { TASK_PRIORITIES, TASK_STATUSES } from './model/types';
import type { Task, TaskDetail, TaskStatus, TaskPriority } from './model/types';

const taskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  milestoneId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  assignee: userSummarySchema.optional(),
  estimateHours: z.number(),
  loggedHours: z.number(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()),
  commentCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const taskDetailSchema = taskSchema.extend({
  comments: z.array(
    z.object({ id: z.string(), author: userSummarySchema, body: z.string(), createdAt: z.string() }),
  ),
});

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  sort?: string;
  dir?: string;
}

export async function fetchProjectTasks(projectId: string, params: TaskListParams) {
  const { data } = await apiClient.get(`/projects/${projectId}/tasks${toQuery(params)}`);
  return paginatedSchema(taskSchema).parse(data);
}

export async function fetchTask(id: string): Promise<TaskDetail> {
  const { data } = await apiClient.get(`/tasks/${id}`);
  return taskDetailSchema.parse(data);
}

export function useProjectTasksQuery(projectId: string, params: TaskListParams) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId, params),
    queryFn: () => fetchProjectTasks(projectId, params),
    placeholderData: keepPreviousData,
  });
}

export function useTaskQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id ?? ''),
    queryFn: () => fetchTask(id!),
    enabled: Boolean(id),
  });
}

/** Apply an optimistic patch to every cached task list + detail for a project. */
function patchTaskCaches(qc: QueryClient, projectId: string, taskId: string, patch: Partial<Task>) {
  const listKey = ['projects', projectId, 'tasks'];
  const previousLists = qc.getQueriesData<Paginated<Task>>({ queryKey: listKey });
  previousLists.forEach(([key, value]) => {
    if (!value) return;
    qc.setQueryData<Paginated<Task>>(key, {
      ...value,
      items: value.items.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    });
  });
  const detailKey = queryKeys.tasks.detail(taskId);
  const previousDetail = qc.getQueryData<TaskDetail>(detailKey);
  if (previousDetail) qc.setQueryData<TaskDetail>(detailKey, { ...previousDetail, ...patch });
  return { previousLists, previousDetail, detailKey };
}

/** Invalidate everything a task change can ripple into (health, KPIs, workload, audit). */
function invalidateRipples(qc: QueryClient, projectId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  qc.invalidateQueries({ queryKey: queryKeys.projects.all });
  qc.invalidateQueries({ queryKey: queryKeys.members.all });
  qc.invalidateQueries({ queryKey: queryKeys.members.directory });
  qc.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
  qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
  qc.invalidateQueries({ queryKey: ['activities'] });
  qc.invalidateQueries({ queryKey: ['projects', projectId, 'activities'] });
  qc.invalidateQueries({ queryKey: queryKeys.notifications });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus; projectId: string }) =>
      apiClient.patch(`/tasks/${id}`, { status }).then((r) => taskDetailSchema.parse(r.data)),
    onMutate: async ({ id, status, projectId }) => {
      await qc.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
      await qc.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
      return patchTaskCaches(qc, projectId, id, { status });
    },
    onError: (error, _vars, context) => {
      context?.previousLists.forEach(([key, value]) => qc.setQueryData(key, value));
      if (context?.previousDetail) qc.setQueryData(context.detailKey, context.previousDetail);
      toast.error('Could not update task', isApiError(error) ? error.message : undefined);
    },
    onSettled: (_data, _error, vars) => invalidateRipples(qc, vars.projectId),
  });
}

export function useReassignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string | null; projectId: string; assignee?: Task['assignee'] }) =>
      apiClient.patch(`/tasks/${id}`, { assigneeId }).then((r) => taskDetailSchema.parse(r.data)),
    onMutate: async ({ id, projectId, assignee }) => {
      await qc.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
      await qc.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
      return patchTaskCaches(qc, projectId, id, { assignee: assignee ?? undefined });
    },
    onError: (error, _vars, context) => {
      context?.previousLists.forEach(([key, value]) => qc.setQueryData(key, value));
      if (context?.previousDetail) qc.setQueryData(context.detailKey, context.previousDetail);
      toast.error('Could not reassign task', isApiError(error) ? error.message : undefined);
    },
    onSettled: (_data, _error, vars) => invalidateRipples(qc, vars.projectId),
  });
}

export interface CreateTaskBody {
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeId?: string;
  estimateHours: number;
  dueDate?: string;
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskBody) =>
      apiClient.post(`/projects/${projectId}/tasks`, body).then((r) => taskDetailSchema.parse(r.data)),
    onSuccess: () => {
      toast.success('Task created');
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      invalidateRipples(qc, projectId);
    },
  });
}

export function useAddComment(taskId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiClient.post(`/tasks/${taskId}/comments`, { body }).then((r) => taskDetailSchema.parse(r.data)),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.tasks.detail(taskId), data);
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}
