import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { getResponse } from 'msw';
import { apiClient } from '@/shared/api/client';
import { handlers } from './handlers';

function toFetchRequest(config: InternalAxiosRequestConfig): Request {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL(axios.getUri(config), origin);
  const headers = new Headers();
  const raw = AxiosHeaders.from(config.headers).toJSON();
  for (const [key, value] of Object.entries(raw)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }

  const method = (config.method ?? 'get').toUpperCase();
  const init: RequestInit = { method, headers };
  if (config.data != null && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
  }
  return new Request(url, init);
}

function createMockAxiosAdapter(): AxiosAdapter {
  return async (config) => {
    const request = toFetchRequest(config);
    const response = await getResponse(handlers, request);
    if (!response) {
      throw new AxiosError(
        `No mock handler for ${config.method?.toUpperCase()} ${axios.getUri(config)}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    const axiosResponse = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request,
    };

    if (response.status >= 400) {
      throw new AxiosError(
        typeof data === 'object' && data && 'message' in data ? String((data as { message: string }).message) : response.statusText,
        response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        config,
        request,
        axiosResponse,
      );
    }

    return axiosResponse;
  };
}

/** Fulfill `/api` calls in-process so login works on Vercel without a Service Worker. */
export function installAxiosMockAdapter(): void {
  apiClient.defaults.adapter = createMockAxiosAdapter();
}
