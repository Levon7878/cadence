import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient, isApiError } from '@/shared/api/client';
import { ROLES } from '@/shared/lib/permissions';
import { userSummarySchema } from '@/shared/lib/schemas';
import { useSessionStore } from '@/entities/session';
import type { AuthUser } from '@/entities/member/model/types';

const authUserSchema = userSummarySchema.extend({
  role: z.enum(ROLES),
  organizationId: z.string(),
});

const authResponseSchema = z.object({ token: z.string(), user: authUserSchema });

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get('/auth/me');
  return authUserSchema.parse(data);
}

export interface LoginBody {
  email: string;
  password: string;
}
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (body: LoginBody) => {
      const { data } = await apiClient.post('/auth/login', body);
      return authResponseSchema.parse(data);
    },
    onSuccess: ({ user, token }) => setSession(user, token),
  });
}

export function useRegister() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (body: RegisterBody) => {
      const { data } = await apiClient.post('/auth/register', body);
      return authResponseSchema.parse(data);
    },
    onSuccess: ({ user, token }) => setSession(user, token),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: { email: string }) => apiClient.post('/auth/forgot-password', body),
  });
}

/** Extract field errors from a normalized ApiError for RHF `setError`. */
export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  return isApiError(error) ? error.fieldErrors : undefined;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return isApiError(error) ? error.message : fallback;
}
