import { createServerClient, parseCookieHeader, combineChunks } from '@supabase/auth-helpers-nextjs';
import { supabaseDirectUrl } from './direct-url';
import type { NextRequest } from 'next/server';

/**
 * Supabase client for Next.js Route Handlers.
 * Uses the direct Supabase URL (not the /api/supabase proxy) and reads the
 * user session from request cookies, including chunked auth tokens
 * (sb-xxx-auth-token.0, .1, ...) produced by @supabase/ssr.
 */
export function createRouteHandlerSupabase(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const parsed = parseCookieHeader(cookieHeader);

  return createServerClient(
    supabaseDirectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // combineChunks joins sb-xxx-auth-token.0 + .1 + ... into one value
        get: (name) =>
          combineChunks(name, (chunkName) =>
            parsed.find((c) => c.name === chunkName)?.value
          ),
        set: () => {},
        remove: () => {},
      },
    }
  );
}
