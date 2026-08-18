import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Dialog, Field, Input, Select } from '@/shared/ui';
import { getFieldErrors } from '@/features/auth';
import { useCreateProject, type CreateProjectBody } from '@/entities/project';
import { useWorkspacesQuery } from '@/entities/workspace';

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  key: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace is required'),
  status: z.enum(['planning', 'active']),
  budget: z.coerce.number().min(0, 'Budget must be 0 or more'),
  startDate: z.string().min(1, 'Start date is required'),
  targetDate: z.string().min(1, 'Target date is required'),
}).refine((v) => v.targetDate >= v.startDate, {
  message: 'Target date must be after the start date',
  path: ['targetDate'],
});

type FormValues = z.input<typeof schema>;

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
];

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: workspaces } = useWorkspacesQuery();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      key: '',
      workspaceId: '',
      status: 'planning',
      budget: 50_000,
      startDate: isoDate(),
      targetDate: isoDate(90),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path[0] as keyof FormValues, { message: issue.message });
      }
      return;
    }
    const body: CreateProjectBody = {
      name: parsed.data.name,
      key: parsed.data.key || undefined,
      workspaceId: parsed.data.workspaceId,
      status: parsed.data.status,
      budget: parsed.data.budget,
      startDate: parsed.data.startDate,
      targetDate: parsed.data.targetDate,
    };
    try {
      const project = await createProject.mutateAsync(body);
      reset();
      onClose();
      navigate(`/projects/${project.id}`);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        for (const [k, m] of Object.entries(fieldErrors)) setError(k as keyof FormValues, { message: m });
      }
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New project"
      description="Create a delivery project in one of your workspaces."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting || createProject.isPending}>Create project</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Name" error={errors.name?.message} required>
          <Input placeholder="e.g. Atlas Checkout" {...register('name')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Workspace" error={errors.workspaceId?.message} required>
            <Select
              options={[{ value: '', label: 'Select workspace' }, ...(workspaces ?? []).map((w) => ({ value: w.id, label: w.name }))]}
              {...register('workspaceId')}
            />
          </Field>
          <Field label="Key" error={errors.key?.message} description="Leave blank to auto-generate.">
            <Input placeholder="NOR-19" {...register('key')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select options={STATUS_OPTIONS} {...register('status')} />
          </Field>
          <Field label="Budget (USD)" error={errors.budget?.message} required>
            <Input type="number" min={0} step={1000} {...register('budget')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" error={errors.startDate?.message} required>
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field label="Target date" error={errors.targetDate?.message} required>
            <Input type="date" {...register('targetDate')} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
