import { Link } from 'react-router-dom';
import { RegisterForm } from '@/features/auth';
import { AuthLayout } from './AuthLayout';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start tracking delivery in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
