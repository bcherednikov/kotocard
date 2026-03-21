import { createClient } from '@supabase/supabase-js';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseUrlFromEnv = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';

/**
 * Прод через прокси: в env может быть зашит https://kotocard.borische.ru/api/supabase,
 * а пользователь открыл сайт по IP или другому хосту — fetch на чужой origin даёт Failed to fetch.
 * В браузере всегда используем текущий origin.
 */
function resolveSupabaseUrl(): string {
  if (!supabaseUrlFromEnv) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (typeof window !== 'undefined' && supabaseUrlFromEnv.includes('/api/supabase')) {
    return `${window.location.origin}/api/supabase`;
  }
  return supabaseUrlFromEnv;
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(resolveSupabaseUrl(), supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'kotocard-web'
    }
  }
});
