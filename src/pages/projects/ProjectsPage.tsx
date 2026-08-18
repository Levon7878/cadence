import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Button, DataTable, EmptyState, Input, Pagination, Select, type Column } from '@/shared/ui';
import { useUrlState } from '@/shared/hooks/useUrlState';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Can } from '@/features/rbac';
import { CreateProjectDialog } from '@/features/project-create/CreateProjectDialog';
import {
  ProjectHealthBadge,
  ProjectStatusBadge,
  useProjectsQuery,
  type Project,
} from '@/entities/project';
import { useWorkspacesQuery } from '@/entities/workspace';
import { Progress } from '@/shared/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

const HEALTH_OPTIONS = [
  { value: '', label: 'All health' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'off_track', label: 'Off track' },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { get, getNumber, set } = useUrlState();
  const { data: workspaces } = useWorkspacesQuery();
  const [createOpen, setCreateOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(get('search'));
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  useEffect(() => {
    set({ search: debouncedSearch }, { resetPage: true });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const params = {
    page: getNumber('page', 1),
    pageSize: 10,
    search: get('search') || undefined,
    status: get('status') || undefined,
    health: get('health') || undefined,
    workspaceId: get('workspaceId') || undefined,
    sort: get('sort') || undefined,
    dir: (get('dir') as 'asc' | 'desc') || undefined,
  };

  const { data, isLoading, isError, refetch } = useProjectsQuery(params);

  const sort = params.sort ? { id: params.sort, dir: params.dir ?? 'asc' } : undefined;
  const onSort = (id: string) => {
    const nextDir = params.sort === id && params.dir === 'asc' ? 'desc' : 'asc';
    set({ sort: id, dir: nextDir });
  };

  const columns: Column<Project>[] = [
    {
      id: 'name',
      header: 'Project',
      sortable: true,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{p.name}</p>
          <p className="text-sm text-text-subtle">{p.key}</p>
        </div>
      ),
    },
    { id: 'status', header: 'Status', cell: (p) => <ProjectStatusBadge status={p.status} /> },
    { id: 'health', header: 'Health', sortable: true, cell: (p) => <ProjectHealthBadge health={p.health} /> },
    {
      id: 'progress',
      header: 'Progress',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <Progress value={p.progress} className="w-24" />
          <span className="text-sm tabular-nums text-text-muted">{p.progress}%</span>
        </div>
      ),
    },
    { id: 'budget', header: 'Budget', sortable: true, align: 'right', cell: (p) => <span className="tabular-nums">{formatCurrency(p.spent, true)} / {formatCurrency(p.budget, true)}</span> },
    { id: 'targetDate', header: 'Target', sortable: true, align: 'right', cell: (p) => <span className="tabular-nums text-text-muted">{formatDate(p.targetDate)}</span> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="All delivery projects across your workspaces."
        actions={
          <Can action="project:create">
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>New project</Button>
          </Can>
        }
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            leftIcon={<Search />}
            placeholder="Search projects…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search projects"
          />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" options={STATUS_OPTIONS} value={params.status ?? ''} onChange={(e) => set({ status: e.target.value }, { resetPage: true })} aria-label="Filter by status" />
          <Select className="w-32" options={HEALTH_OPTIONS} value={params.health ?? ''} onChange={(e) => set({ health: e.target.value }, { resetPage: true })} aria-label="Filter by health" />
          <Select
            className="w-40"
            options={[{ value: '', label: 'All workspaces' }, ...(workspaces ?? []).map((w) => ({ value: w.id, label: w.name }))]}
            value={params.workspaceId ?? ''}
            onChange={(e) => set({ workspaceId: e.target.value }, { resetPage: true })}
            aria-label="Filter by workspace"
          />
        </div>
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(p) => p.id}
          loading={isLoading}
          error={isError}
          onRetry={() => refetch()}
          sort={sort}
          onSortChange={onSort}
          onRowClick={(p) => navigate(`/projects/${p.id}`)}
          caption="Projects"
          emptyState={
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description="Try adjusting your search or filters."
              action={
                <Can action="project:create">
                  <Button leftIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>New project</Button>
                </Can>
              }
            />
          }
        />
        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={(p) => set({ page: p })} />
        )}
      </div>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageContainer>
  );
}
