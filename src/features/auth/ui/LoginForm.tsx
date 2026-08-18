import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Alert, Button, Field, Input } from '@/shared/ui';
import { useLogin, getErrorMessage, getFieldErrors, type LoginBody } from '../api';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginBody>({
    defaultValues: { email: 'alex.morgan@cadence.dev', password: 'password' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const seen = new Set<string>();
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (seen.has(key)) continue;
        seen.add(key);
        setError(key as keyof LoginBody, { message: issue.message });
      }
      return;
    }
    try {
      await login.mutateAsync(values);
      navigate('/', { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors) {
        for (const [key, message] of Object.entries(fieldErrors)) {
          setError(key as keyof LoginBody, { message });
        }
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {login.isError && !getFieldErrors(login.error) && (
        <Alert tone="danger">{getErrorMessage(login.error)}</Alert>
      )}
      <Field label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message} required>
        <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
      </Field>
      <Button type="submit" fullWidth loading={isSubmitting || login.isPending}>
        Sign in
      </Button>
      <p className="text-center text-sm text-text-muted">
        Demo credentials are pre-filled — just click Sign in.
      </p>
    </form>
  );
}
