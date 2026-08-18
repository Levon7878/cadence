import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, Field, Input } from '@/shared/ui';
import { useForgotPassword, getErrorMessage } from '../api';

const schema = z.object({ email: z.string().min(1, 'Email is required').email('Enter a valid email') });

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError('email', { message: parsed.error.issues[0].message });
      return;
    }
    await forgot.mutateAsync(values);
  });

  if (forgot.isSuccess) {
    return (
      <Alert tone="success" title="Check your inbox">
        If an account exists for that email, we've sent password reset instructions.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {forgot.isError && <Alert tone="danger">{getErrorMessage(forgot.error)}</Alert>}
      <Field label="Email" description="We'll send a reset link to this address." error={errors.email?.message} required>
        <Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
      </Field>
      <Button type="submit" fullWidth loading={isSubmitting || forgot.isPending}>
        Send reset link
      </Button>
    </form>
  );
}
