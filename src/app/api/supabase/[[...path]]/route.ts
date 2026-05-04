import { supabaseDirectUrl } from '@/lib/supabase/direct-url';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // Node.js fetch auto-decompresses the body but keeps Content-Encoding header —
  // forwarding it causes ERR_CONTENT_DECODING_FAILED in the browser.
  'content-encoding',
]);

const ALLOWED_ROOT = new Set(['auth', 'rest', 'storage', 'realtime', 'functions', 'graphql']);

function forwardRequestHeaders(from: Headers): Headers {
  const out = new Headers();
  for (const [key, value] of from.entries()) {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k) || k === 'host') continue;
    out.set(key, value);
  }
  return out;
}

function forwardResponseHeaders(from: Headers): Headers {
  const out = new Headers();
  for (const [key, value] of from.entries()) {
    const k = key.toLowerCase();
    if (HOP_BY_HOP.has(k)) continue;
    out.append(key, value);
  }
  return out;
}

function isAllowedPath(segments: string[]): boolean {
  if (segments.length === 0) return false;
  return ALLOWED_ROOT.has(segments[0] ?? '');
}

type RouteCtx = { params: Promise<{ path?: string[] }> };

const MAX_BODY_BUFFER = 512 * 1024; // auth/json — мало; большие upload в storage без ретраев

function isRetryableFetchError(e: unknown): boolean {
  if (!(e instanceof TypeError)) return false;
  const code = (e as Error & { cause?: NodeJS.ErrnoException }).cause?.code;
  return (
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED'
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** VPS: периодический ENOTFOUND у резолвера — несколько попыток. Тело больших POST не буферизуем → без ретрая. */
async function fetchUpstream(
  target: string,
  method: string,
  headers: Headers,
  body: BodyInit | undefined,
  isStreamBody: boolean
): Promise<Response> {
  const attempts = isStreamBody ? 1 : 4;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    // 25s timeout — nginx proxy_read_timeout usually 60s; fail fast to avoid 504
    const timer = setTimeout(() => controller.abort(), 25_000);
    const init: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
      redirect: 'follow',
      body,
      signal: controller.signal,
    };
    if (isStreamBody && body != null) {
      init.duplex = 'half';
    }
    try {
      const res = await fetch(target, init);
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (!isRetryableFetchError(e) || i === attempts - 1) throw e;
      await sleep(120 * 2 ** i);
    }
  }
  throw lastErr;
}

async function proxy(request: Request, ctx: RouteCtx) {
  const { path: segments = [] } = await ctx.params;

  if (!isAllowedPath(segments)) {
    return new Response('Not found', { status: 404 });
  }

  let upstreamBase: string;
  try {
    upstreamBase = supabaseDirectUrl();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Supabase URL misconfigured';
    return new Response(msg, { status: 500 });
  }

  const { search } = new URL(request.url);
  const target = `${upstreamBase}/${segments.join('/')}${search}`;
  const method = request.method;
  const hdrs = forwardRequestHeaders(request.headers);

  let body: BodyInit | undefined;
  let isStreamBody = false;

  if (method !== 'GET' && method !== 'HEAD') {
    const cl = request.headers.get('content-length');
    const n = cl ? Number(cl) : -1;
    if (n >= 0 && n <= MAX_BODY_BUFFER) {
      body = await request.arrayBuffer();
    } else {
      body = request.body ?? undefined;
      isStreamBody = body != null;
    }
  }

  const upstream = await fetchUpstream(target, method, hdrs, body, isStreamBody);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream.headers),
  });
}

export async function GET(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}

export async function POST(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}

export async function PUT(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}

export async function OPTIONS(request: Request, ctx: RouteCtx) {
  return proxy(request, ctx);
}
