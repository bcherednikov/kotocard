import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

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
