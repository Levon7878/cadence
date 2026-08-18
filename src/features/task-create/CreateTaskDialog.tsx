import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Dialog, Field, Input, Select, Textarea } from '@/shared/ui';
import { TASK_PRIORITIES, useCreateTask, type CreateTaskBody } from '@/entities/task';
import { useMemberDirectoryQuery } from '@/entities/member';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES),
  assigneeId: z.string().optional(),
  estimateHours: z.coerce.number().min(0, 'Must be 0 or more').max(200, 'Too large'),
  dueDate: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export function CreateTaskDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const createTask = useCreateTask(projectId);
  const { data: directory } = useMemberDirectoryQuery();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { title: '', description: '', priority: 'medium', assigneeId: '', estimateHours: 4, dueDate: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    const body: CreateTaskBody = {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId || undefined,
      estimateHours: parsed.data.estimateHours,
      dueDate: parsed.data.dueDate || undefined,
    };
    await createTask.mutateAsync(body);
    reset();
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New task"
      description="Add a task to this project."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={isSubmitting || createTask.isPending}>Create task</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Title" error={errors.title?.message} required>
          <Input placeholder="e.g. Implement export pipeline" {...register('title')} />
        </Field>
        <Field label="Description">
          <Textarea placeholder="Add context and acceptance criteria…" {...register('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select options={TASK_PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} {...register('priority')} />
          </Field>
          <Field label="Estimate (hours)" error={errors.estimateHours?.message}>
            <Input type="number" min={0} step={1} {...register('estimateHours')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <Select options={[{ value: '', label: 'Unassigned' }, ...(directory ?? []).map((m) => ({ value: m.id, label: m.user.name }))]} {...register('assigneeId')} />
          </Field>
          <Field label="Due date">
            <Input type="date" {...register('dueDate')} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
