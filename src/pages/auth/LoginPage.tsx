import { Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth';
import { AuthLayout } from './AuthLayout';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Cadence workspace."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm text-text-muted hover:text-text">
          Forgot your password?
        </Link>
      </div>
    </AuthLayout>
  );
}
