import type { SupabaseClient } from '@supabase/supabase-js';

export type DeckProgress = {
  total: number;
  mastered: number;
  percent: number;
};

/**
 * Progress per deck: total cards, mastered (at least one card_progress with status 'mastered' per card), percent.
 * Direction (ru_to_en / en_to_ru) is not considered — one metric per card.
 */
export async function getDeckProgress(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<DeckProgress> {
  const map = await getDecksProgress(supabase, userId, [deckId]);
  return map.get(deckId) ?? { total: 0, mastered: 0, percent: 0 };
}

/**
 * Batch: progress for multiple decks. One set of queries, no N+1.
 */
export async function getDecksProgress(
  supabase: SupabaseClient,
  userId: string,
  deckIds: string[]
): Promise<Map<string, DeckProgress>> {
  const result = new Map<string, DeckProgress>();
  if (deckIds.length === 0) return result;

  // All cards in these decks: deck_id -> card_id[]
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id, deck_id')
    .in('deck_id', deckIds);

  if (cardsError) throw cardsError;

  const cardsByDeck = new Map<string, string[]>();
  const allCardIds: string[] = [];
  for (const c of cards ?? []) {
    const list = cardsByDeck.get(c.deck_id) ?? [];
    list.push(c.id);
    cardsByDeck.set(c.deck_id, list);
    allCardIds.push(c.id);
  }

  // Per-deck totals
  for (const [deckId, ids] of cardsByDeck) {
    result.set(deckId, {
      total: ids.length,
      mastered: 0,
      percent: 0
    });
  }

  if (allCardIds.length === 0) {
    for (const [deckId, p] of result) {
      result.set(deckId, { ...p, percent: 0 });
    }
    return result;
  }

  // All mastered progress for this user and these cards (any direction)
  const { data: masteredRows, error: progressError } = await supabase
    .from('card_progress')
    .select('card_id')
    .eq('user_id', userId)
    .eq('status', 'mastered')
    .in('card_id', allCardIds);

  if (progressError) throw progressError;

  const masteredCardIds = new Set((masteredRows ?? []).map((r) => r.card_id));

  // Count mastered per deck and compute percent
  for (const [deckId, cardIds] of cardsByDeck) {
    const total = cardIds.length;
    const mastered = cardIds.filter((id) => masteredCardIds.has(id)).length;
    const percent = total === 0 ? 0 : Math.round(Math.min(100, (mastered / total) * 100));
    result.set(deckId, { total, mastered, percent });
  }

  return result;
}
