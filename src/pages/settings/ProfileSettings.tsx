import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiClient } from '@/shared/api/client';
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input } from '@/shared/ui';
import { toast } from '@/shared/ui/toast';
import { useSessionStore } from '@/entities/session';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

export default function ProfileSettings() {
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });
  const name = watch('name');

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    await apiClient.put('/settings/profile', values);
    if (user) setUser({ ...user, name: values.name, email: values.email });
    toast.success('Profile updated');
  });

  return (
    <Card>
      <CardHeader title="Profile" description="Update your personal information." />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex items-center gap-4">
            <Avatar name={name || 'You'} size="lg" />
            <div>
              <p className="text-base font-medium text-text">Avatar</p>
              <p className="text-sm text-text-muted">Generated from your initials.</p>
            </div>
          </div>
          <Field label="Full name" error={errors.name?.message} required>
            <Input {...register('name')} />
          </Field>
          <Field label="Email" error={errors.email?.message} required>
            <Input type="email" {...register('email')} />
          </Field>
          <div>
            <Button type="submit" loading={isSubmitting}>Save changes</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
