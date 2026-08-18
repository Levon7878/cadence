import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Laptop, Smartphone } from 'lucide-react';
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Switch } from '@/shared/ui';
import { toast } from '@/shared/ui/toast';

const schema = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    next: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

const SESSIONS = [
  { id: '1', device: 'MacBook Pro · Chrome', location: 'Berlin, DE', current: true, icon: Laptop },
  { id: '2', device: 'iPhone 15 · Safari', location: 'Berlin, DE', current: false, icon: Smartphone },
];

export default function SecuritySettings() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const onSubmit = handleSubmit((values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    reset();
    toast.success('Password updated');
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Password" description="Change your account password." />
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="Current password" error={errors.current?.message} required>
              <Input type="password" autoComplete="current-password" {...register('current')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" error={errors.next?.message} required>
                <Input type="password" autoComplete="new-password" {...register('next')} />
              </Field>
              <Field label="Confirm password" error={errors.confirm?.message} required>
                <Input type="password" autoComplete="new-password" {...register('confirm')} />
              </Field>
            </div>
            <div><Button type="submit" loading={isSubmitting}>Update password</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Two-factor authentication" description="Add an extra layer of security." />
        <CardBody>
          <div className="flex items-center justify-between">
            <p className="text-base text-text-muted">Authenticator app (TOTP)</p>
            <Switch aria-label="Enable two-factor authentication" onChange={(e) => toast.info(e.target.checked ? '2FA enabled (demo)' : '2FA disabled (demo)')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Active sessions" />
        <CardBody>
          <ul className="divide-y divide-border">
            {SESSIONS.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <s.icon className="size-5 text-text-muted" aria-hidden />
                <div className="flex-1">
                  <p className="text-base font-medium text-text">{s.device}</p>
                  <p className="text-sm text-text-muted">{s.location}</p>
                </div>
                {s.current ? <Badge tone="success">This device</Badge> : <Button size="sm" variant="ghost" onClick={() => toast.success('Session revoked')}>Revoke</Button>}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
