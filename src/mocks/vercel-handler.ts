import { getResponse } from 'msw';
import { handlers } from './handlers';

interface VercelReq {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelRes {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value.join(',') : value;
}

/** Node serverless entry used on Vercel so POST /api/* is not served as static HTML. */
export default async function vercelApiHandler(req: VercelReq, res: VercelRes): Promise<void> {
  const host = headerValue(req.headers['x-forwarded-host']) ?? headerValue(req.headers.host) ?? 'localhost';
  const proto = headerValue(req.headers['x-forwarded-proto']) ?? 'https';
  const url = `${proto}://${host}${req.url ?? '/'}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const normalized = headerValue(value);
    if (normalized) headers.set(key, normalized);
  }

  const method = (req.method ?? 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Demo-Role');
    res.end();
    return;
  }

  const init: RequestInit = { method, headers };
  if (req.body != null && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }

  const request = new Request(url, init);
  const response =
    (await getResponse(handlers, request)) ??
    new Response(JSON.stringify({ code: 'not_found', message: 'No mock handler for this request.' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });

  res.statusCode = response.status;
  res.setHeader('Access-Control-Allow-Origin', '*');
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    res.setHeader(key, value);
  });
  res.end(await response.text());
}
