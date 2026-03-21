import { createClient } from '@supabase/supabase-js';
import { supabaseDirectUrl } from './direct-url';

/** Anon-клиент для Route Handlers (Node): всегда на прямой Supabase, не на прокси. */
export function createServerAnonClient() {
  return createClient(supabaseDirectUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: { headers: { 'x-client-info': 'kotocard-server' } },
  });
}
