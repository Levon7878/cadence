import axios, { type AxiosAdapter, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';
import type { ApiError } from '@/shared/types/api';
import { tokenStore } from './token';
import { requestContext } from './request-context';

/** Type guard for our normalized error shape. */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'code' in value &&
    'message' in value
  );
}

interface BackendErrorBody {
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Called when a 401 is observed. Wired up by the app to log the user out. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function normalizeError(error: AxiosError<BackendErrorBody>): ApiError {
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      code: data?.code ?? `http_${status}`,
      message: data?.message ?? error.message ?? 'Request failed',
      fieldErrors: data?.fieldErrors,
    };
  }
  if (error.request) {
    return { status: 0, code: 'network_error', message: 'Network error — please check your connection.' };
  }
  return { status: 0, code: 'client_error', message: error.message ?? 'Unexpected error' };
}

/** Optional in-process adapter (mock API). Set from the app entry before any requests. */
let mockAdapter: AxiosAdapter | undefined;

export function setMockAdapter(adapter: AxiosAdapter): void {
  mockAdapter = adapter;
  apiClient.defaults.adapter = adapter;
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (mockAdapter) {
      config.adapter = mockAdapter;
    }
    const token = tokenStore.get();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    const demoRole = requestContext.getDemoRole();
    if (demoRole) {
      config.headers.set('X-Demo-Role', demoRole);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<BackendErrorBody>) => {
      const normalized = normalizeError(error);
      if (normalized.status === 401) {
        onUnauthorized?.();
      }
      return Promise.reject(normalized);
    },
  );

  return instance;
}

export const apiClient = createApiClient();
