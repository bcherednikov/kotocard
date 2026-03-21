/**
 * Прямой URL проекта Supabase (https://xxx.supabase.co).
 * На сервере всегда ходим сюда, чтобы не зациклиться на /api/supabase.
 * В браузере при блокировке *.supabase.co NEXT_PUBLIC_SUPABASE_URL указывает на прокси на этом же домене.
 */
export function supabaseDirectUrl(): string {
  const direct = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';

  if (direct) return direct;

  if (!pub) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  if (pub.includes('/api/supabase')) {
    throw new Error(
      'На сервере задайте SUPABASE_URL (прямой https://<ref>.supabase.co), пока в NEXT_PUBLIC_SUPABASE_URL указан прокси /api/supabase'
    );
  }

  return pub;
}
