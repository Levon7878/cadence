import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button, Checkbox, Dialog, Field, Input, Select } from '@/shared/ui';
import { ROLES, ROLE_META } from '@/shared/lib/permissions';
import { useInviteMember, type InviteMemberBody } from '@/entities/member';
import { useWorkspacesQuery } from '@/entities/workspace';
import { getFieldErrors } from '@/features/auth';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role: z.enum(ROLES),
  workspaceIds: z.array(z.string()).min(1, 'Select at least one workspace'),
});

// Assignable roles exclude owner (single-owner org).
const ASSIGNABLE_ROLES = ROLES.filter((r) => r !== 'owner');

export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const invite = useInviteMember();
  const { data: workspaces } = useWorkspacesQuery();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberBody>({
    defaultValues: { name: '', email: '', role: 'member', workspaceIds: [] },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(issue.path[0] as keyof InviteMemberBody, { message: issue.message });
      return;
    }
    try {
      await invite.mutateAsync(values);
      reset();
      onClose();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) for (const [k, m] of Object.entries(fieldErrors)) setError(k as keyof InviteMemberBody, { message: m });
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite member"
      description="Send an invitation to join your organization."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting || invite.isPending}>Send invitation</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Full name" error={errors.name?.message} required>
          <Input placeholder="Jane Doe" {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" placeholder="jane@company.com" {...register('email')} />
        </Field>
        <Field label="Role" description={ROLE_META.member.description} error={errors.role?.message} required>
          <Select options={ASSIGNABLE_ROLES.map((r) => ({ value: r, label: ROLE_META[r].label }))} {...register('role')} />
        </Field>
        <Field label="Workspace access" error={errors.workspaceIds?.message} required>
          <Controller
            control={control}
            name="workspaceIds"
            render={({ field }) => (
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                {(workspaces ?? []).map((ws) => (
                  <Checkbox
                    key={ws.id}
                    label={ws.name}
                    checked={field.value.includes(ws.id)}
                    onChange={(e) =>
                      field.onChange(
                        e.target.checked ? [...field.value, ws.id] : field.value.filter((id) => id !== ws.id),
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
        </Field>
      </form>
    </Dialog>
  );
}
