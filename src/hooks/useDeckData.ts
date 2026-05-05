import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';

/** Fetcher that attaches the current Supabase Bearer token so server-side
 *  route handlers can authenticate the user (browser stores session in
 *  localStorage, not cookies, so cookie-based auth on the server won't work). */
async function fetcher(url: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useDeckData(deckId: string) {
  return useSWR(deckId ? `/api/data/deck/${deckId}` : null, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
    dedupingInterval: 10_000,
  });
}

export function useDashboard() {
  return useSWR('/api/data/dashboard', fetcher, {
    revalidateOnFocus: true,
    errorRetryCount: 3,
    dedupingInterval: 30_000,
  });
}

export function useStudyData(deckId: string) {
  return useSWR(deckId ? `/api/data/deck/${deckId}/study` : null, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: 5_000,
  });
}

export function useTestData(deckId: string) {
  return useSWR(deckId ? `/api/data/deck/${deckId}/test` : null, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: 5_000,
  });
}
