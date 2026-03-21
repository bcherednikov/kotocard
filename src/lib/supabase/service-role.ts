import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseDirectUrl } from './direct-url';

let cached: SupabaseClient | null = null;

/** Ленивая инициализация — не трогаем env при импорте модуля (сборка next). */
export function getServiceRoleClient(): SupabaseClient {
  if (!cached) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    cached = createClient(supabaseDirectUrl(), key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
