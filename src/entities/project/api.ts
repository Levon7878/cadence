import { z } from 'zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import { toQuery } from '@/shared/api/list-params';
import { paginatedSchema, userSummarySchema } from '@/shared/lib/schemas';
import { isApiError } from '@/shared/api/client';
import { toast } from '@/shared/ui/toast';
import { PROJECT_HEALTHS, PROJECT_STATUSES } from './model/types';
import type { Project, ProjectDetail, ProjectStatus } from './model/types';

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  workspaceId: z.string(),
  clientId: z.string().optional(),
  status: z.enum(PROJECT_STATUSES),
  health: z.enum(PROJECT_HEALTHS),
  owner: userSummarySchema,
  memberIds: z.array(z.string()),
  budget: z.number(),
  spent: z.number(),
  progress: z.number(),
  taskCount: z.number(),
  openTaskCount: z.number(),
  blockedTaskCount: z.number(),
  startDate: z.string(),
  targetDate: z.string(),
  completedDate: z.string().optional(),
});

const milestoneSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  dueDate: z.string(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'overdue']),
  progress: z.number(),
  taskCount: z.number(),
});

const projectDetailSchema = projectSchema.extend({
  milestones: z.array(milestoneSchema),
  healthReasons: z.array(z.string()),
});

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  health?: string;
  workspaceId?: string;
  sort?: string;
  dir?: string;
}

export async function fetchProjects(params: ProjectListParams) {
  const { data } = await apiClient.get(`/projects${toQuery(params)}`);
  return paginatedSchema(projectSchema).parse(data);
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  const { data } = await apiClient.get(`/projects/${id}`);
  return projectDetailSchema.parse(data);
}

export function useProjectsQuery(params: ProjectListParams) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => fetchProjects(params),
    placeholderData: keepPreviousData,
  });
}

export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => fetchProject(id!),
    enabled: Boolean(id),
  });
}

export interface CreateProjectBody {
  name: string;
  key?: string;
  workspaceId: string;
  budget: number;
  startDate: string;
  targetDate: string;
  status?: ProjectStatus;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectBody) =>
      apiClient.post('/projects', body).then((r) => projectDetailSchema.parse(r.data)),
    onSuccess: (project) => {
      toast.success('Project created', `${project.name} is ready.`);
      qc.setQueryData(queryKeys.projects.detail(project.id), project);
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces });
      qc.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
      qc.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors) return;
      toast.error('Could not create project', isApiError(error) ? error.message : undefined);
    },
  });
}

export type { Project, ProjectDetail };
