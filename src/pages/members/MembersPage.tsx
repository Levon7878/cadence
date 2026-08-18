import { useEffect, useState } from 'react';
import { MoreHorizontal, Search, UserPlus, Users } from 'lucide-react';
import { PageContainer, PageHeader } from '@/widgets/app-shell';
import { Avatar, Button, DataTable, DropdownMenu, EmptyState, Input, Pagination, Select, type Column } from '@/shared/ui';
import { useUrlState } from '@/shared/hooks/useUrlState';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { formatDate } from '@/shared/lib/format';
import { ROLES, ROLE_META } from '@/shared/lib/permissions';
import { Can, usePermissions } from '@/features/rbac';
import { InviteMemberDialog } from '@/features/member-invite/InviteMemberDialog';
import {
  RoleBadge,
  useMembersQuery,
  useUpdateMemberRole,
  useSetMemberStatus,
  type Member,
} from '@/entities/member';
import { Badge } from '@/shared/ui';

const STATUS_TONE = { active: 'success', invited: 'warning', deactivated: 'neutral' } as const;

export default function MembersPage() {
  const { get, getNumber, set } = useUrlState();
  const { can } = usePermissions();
  const [inviteOpen, setInviteOpen] = useState(false);
  const updateRole = useUpdateMemberRole();
  const setStatus = useSetMemberStatus();

  const [searchInput, setSearchInput] = useState(get('search'));
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  useEffect(() => {
    set({ search: debouncedSearch }, { resetPage: true });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const params = {
    page: getNumber('page', 1),
    pageSize: 10,
    search: get('search') || undefined,
    role: get('role') || undefined,
    status: get('status') || undefined,
    sort: get('sort') || undefined,
    dir: (get('dir') as 'asc' | 'desc') || undefined,
  };

  const { data, isLoading, isError, refetch } = useMembersQuery(params);

  const columns: Column<Member>[] = [
    {
      id: 'name',
      header: 'Member',
      sortable: true,
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.user.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{m.user.name}</p>
            <p className="truncate text-sm text-text-subtle">{m.user.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'title', header: 'Title', cell: (m) => <span className="text-text-muted">{m.title}</span> },
    { id: 'role', header: 'Role', sortable: true, cell: (m) => <RoleBadge role={m.role} /> },
    { id: 'status', header: 'Status', cell: (m) => <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge> },
    { id: 'joined', header: 'Joined', align: 'right', cell: (m) => <span className="tabular-nums text-text-muted">{formatDate(m.joinedAt)}</span> },
    {
      id: 'actions',
      header: '',
      hideable: false,
      cell: (m) => {
        const items = [];
        if (can('role:assign')) {
          for (const role of ROLES.filter((r) => r !== 'owner' && r !== m.role)) {
            items.push({ label: `Make ${ROLE_META[role].label}`, onSelect: () => updateRole.mutate({ id: m.id, role }) });
          }
        }
        if (can('member:deactivate')) {
          items.push({
            label: m.status === 'deactivated' ? 'Reactivate' : 'Deactivate',
            danger: m.status !== 'deactivated',
            separatorBefore: items.length > 0,
            onSelect: () => setStatus.mutate({ id: m.id, status: m.status === 'deactivated' ? 'active' : 'deactivated' }),
          });
        }
        if (items.length === 0) return <span className="text-sm text-text-subtle">—</span>;
        return (
          <DropdownMenu
            align="end"
            trigger={(p) => (
              <button {...p} aria-label={`Actions for ${m.user.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover">
                <MoreHorizontal className="size-4" />
              </button>
            )}
            items={items}
          />
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Members"
        description="Manage who has access to your organization and their roles."
        actions={
          <Can action="member:invite">
            <Button leftIcon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>Invite member</Button>
          </Can>
        }
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <Input leftIcon={<Search />} placeholder="Search members…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search members" />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" aria-label="Filter by role" options={[{ value: '', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: ROLE_META[r].label }))]} value={params.role ?? ''} onChange={(e) => set({ role: e.target.value }, { resetPage: true })} />
          <Select className="w-36" aria-label="Filter by status" options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'invited', label: 'Invited' }, { value: 'deactivated', label: 'Deactivated' }]} value={params.status ?? ''} onChange={(e) => set({ status: e.target.value }, { resetPage: true })} />
        </div>
      </div>

      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          getRowId={(m) => m.id}
          loading={isLoading}
          error={isError}
          onRetry={() => refetch()}
          caption="Organization members"
          emptyState={<EmptyState icon={Users} title="No members found" description="Try adjusting your search or filters." />}
        />
        {data && data.total > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={(p) => set({ page: p })} />
        )}
      </div>

      <InviteMemberDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </PageContainer>
  );
}
