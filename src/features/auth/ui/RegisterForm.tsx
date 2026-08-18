import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Alert, Button, Field, Input } from '@/shared/ui';
import { useRegister, getErrorMessage, getFieldErrors, type RegisterBody } from '../api';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterBody>({ defaultValues: { name: '', email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setError(issue.path[0] as keyof RegisterBody, { message: issue.message });
      return;
    }
    try {
      await registerMutation.mutateAsync(values);
      navigate('/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) for (const [k, m] of Object.entries(fieldErrors)) setError(k as keyof RegisterBody, { message: m });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {registerMutation.isError && !getFieldErrors(registerMutation.error) && (
        <Alert tone="danger">{getErrorMessage(registerMutation.error)}</Alert>
      )}
      <Field label="Full name" error={errors.name?.message} required>
        <Input autoComplete="name" placeholder="Jane Doe" {...register('name')} />
      </Field>
      <Field label="Work email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
      </Field>
      <Field label="Password" description="At least 6 characters." error={errors.password?.message} required>
        <Input type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
      </Field>
      <Button type="submit" fullWidth loading={isSubmitting || registerMutation.isPending}>
        Create account
      </Button>
    </form>
  );
}
