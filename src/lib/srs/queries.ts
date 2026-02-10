import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserCard, UserCardWithCard, CardData, DeckSrsStats } from './types';

/**
 * Lazy init: create 'new' rows in user_cards for cards that don't have one yet.
 */
export async function ensureUserCardsExist(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<void> {
  // Get all cards in this deck
  const { data: cards, error: cardsErr } = await supabase
    .from('cards')
    .select('id')
    .eq('deck_id', deckId);

  if (cardsErr) throw cardsErr;
  if (!cards || cards.length === 0) return;

  // Get existing user_cards for this user+deck
  const { data: existing, error: existErr } = await supabase
    .from('user_cards')
    .select('card_id')
    .eq('user_id', userId)
    .eq('deck_id', deckId);

  if (existErr) throw existErr;

  const existingCardIds = new Set((existing ?? []).map((r) => r.card_id));
  const missingCards = cards.filter((c) => !existingCardIds.has(c.id));

  if (missingCards.length === 0) return;

  const rows = missingCards.map((c) => ({
    card_id: c.id,
    user_id: userId,
    deck_id: deckId,
    status: 'new' as const,
  }));

  const { error: insertErr } = await supabase.from('user_cards').insert(rows);
  if (insertErr) throw insertErr;
}

/**
 * Cards for study mode: ALL cards in the deck (always show full deck).
 */
export async function getStudyCards(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<UserCardWithCard[]> {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*, cards(*)')
    .eq('user_id', userId)
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserCardWithCard[];
}

/**
 * Cards ready for primary testing: learning/testing with marked_know_at set,
 * and at least one unpassed test.
 */
export async function getPrimaryTestCards(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<UserCardWithCard[]> {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*, cards(*)')
    .eq('user_id', userId)
    .eq('deck_id', deckId)
    .in('status', ['learning', 'testing'])
    .not('marked_know_at', 'is', null)
    .or('test_choice_passed.eq.false,test_audio_passed.eq.false,test_dictation_passed.eq.false')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserCardWithCard[];
}

/**
 * Simple review: all non-new cards (studied at least once), shuffled, limited.
 */
export async function getSimpleReviewCards(
  supabase: SupabaseClient,
  userId: string,
  deckId?: string,
  limit: number = 10
): Promise<UserCardWithCard[]> {
  let query = supabase
    .from('user_cards')
    .select('*, cards(*)')
    .eq('user_id', userId)
    .neq('status', 'new');

  if (deckId) {
    query = query.eq('deck_id', deckId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cards = (data ?? []) as UserCardWithCard[];
  // Shuffle and take limit
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/**
 * Count of cards ready for review across all decks.
 */
export async function getReviewCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('user_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['young', 'mature', 'relearning'])
    .lte('next_review_at', new Date().toISOString());

  if (error) throw error;
  return count ?? 0;
}

/**
 * Update a single user_card row.
 */
export async function updateUserCard(
  supabase: SupabaseClient,
  userCardId: string,
  updates: Partial<UserCard>
): Promise<void> {
  const { error } = await supabase
    .from('user_cards')
    .update(updates)
    .eq('user_card_id', userCardId);

  if (error) throw error;
}

/**
 * Get all deck cards (for generating wrong options in tests).
 */
export async function getAllDeckCards(
  supabase: SupabaseClient,
  deckId: string
): Promise<CardData[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('id, deck_id, ru_text, en_text, ru_transcription, audio_url')
    .eq('deck_id', deckId);

  if (error) throw error;
  return data ?? [];
}

/**
 * SRS stats for a single deck.
 */
export async function getDeckSrsStats(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<DeckSrsStats> {
  // Get total cards in deck
  const { count: totalCount, error: totalErr } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId);

  if (totalErr) throw totalErr;
  const total = totalCount ?? 0;

  // Get user_cards with status counts
  const { data: userCards, error: ucErr } = await supabase
    .from('user_cards')
    .select('status, marked_know_at, test_choice_passed, test_audio_passed, test_dictation_passed, next_review_at')
    .eq('user_id', userId)
    .eq('deck_id', deckId);

  if (ucErr) throw ucErr;

  const cards = userCards ?? [];
  const nowStr = new Date().toISOString();

  let newCount = 0, learningCount = 0, testingCount = 0;
  let youngCount = 0, matureCount = 0, relearningCount = 0;
  let readyForReview = 0, readyForTesting = 0;

  // Cards not yet in user_cards are 'new'
  const trackedCount = cards.length;
  const untrackedNew = Math.max(0, total - trackedCount);

  for (const c of cards) {
    switch (c.status) {
      case 'new': newCount++; break;
      case 'learning': learningCount++; break;
      case 'testing': testingCount++; break;
      case 'young': youngCount++; break;
      case 'mature': matureCount++; break;
      case 'relearning': relearningCount++; break;
    }

    // Ready for review
    if (['young', 'mature', 'relearning'].includes(c.status) && c.next_review_at && c.next_review_at <= nowStr) {
      readyForReview++;
    }

    // Ready for testing
    if (['learning', 'testing'].includes(c.status) && c.marked_know_at &&
      (!c.test_choice_passed || !c.test_audio_passed || !c.test_dictation_passed)) {
      readyForTesting++;
    }
  }

  newCount += untrackedNew;
  const masteredCount = youngCount + matureCount;
  const masteryPercent = total === 0 ? 0 : Math.round((masteredCount / total) * 100);

  return {
    total,
    newCount,
    learningCount,
    testingCount,
    youngCount,
    matureCount,
    relearningCount,
    masteredCount,
    masteryPercent,
    readyForReview,
    readyForTesting,
  };
}

/**
 * Batch SRS stats for multiple decks.
 */
export async function getDecksSrsStats(
  supabase: SupabaseClient,
  userId: string,
  deckIds: string[]
): Promise<Map<string, DeckSrsStats>> {
  const result = new Map<string, DeckSrsStats>();
  if (deckIds.length === 0) return result;

  // Get card counts per deck
  const { data: allCards, error: cardsErr } = await supabase
    .from('cards')
    .select('id, deck_id')
    .in('deck_id', deckIds);

  if (cardsErr) throw cardsErr;

  const cardsByDeck = new Map<string, number>();
  for (const c of allCards ?? []) {
    cardsByDeck.set(c.deck_id, (cardsByDeck.get(c.deck_id) ?? 0) + 1);
  }

  // Get all user_cards for these decks
  const { data: userCards, error: ucErr } = await supabase
    .from('user_cards')
    .select('deck_id, status, marked_know_at, test_choice_passed, test_audio_passed, test_dictation_passed, next_review_at')
    .eq('user_id', userId)
    .in('deck_id', deckIds);

  if (ucErr) throw ucErr;

  const nowStr = new Date().toISOString();

  // Group by deck
  const ucByDeck = new Map<string, typeof userCards>();
  for (const uc of userCards ?? []) {
    const list = ucByDeck.get(uc.deck_id) ?? [];
    list.push(uc);
    ucByDeck.set(uc.deck_id, list);
  }

  for (const deckId of deckIds) {
    const total = cardsByDeck.get(deckId) ?? 0;
    const cards = ucByDeck.get(deckId) ?? [];

    let newCount = 0, learningCount = 0, testingCount = 0;
    let youngCount = 0, matureCount = 0, relearningCount = 0;
    let readyForReview = 0, readyForTesting = 0;

    const untrackedNew = Math.max(0, total - cards.length);

    for (const c of cards) {
      switch (c.status) {
        case 'new': newCount++; break;
        case 'learning': learningCount++; break;
        case 'testing': testingCount++; break;
        case 'young': youngCount++; break;
        case 'mature': matureCount++; break;
        case 'relearning': relearningCount++; break;
      }

      if (['young', 'mature', 'relearning'].includes(c.status) && c.next_review_at && c.next_review_at <= nowStr) {
        readyForReview++;
      }

      if (['learning', 'testing'].includes(c.status) && c.marked_know_at &&
        (!c.test_choice_passed || !c.test_audio_passed || !c.test_dictation_passed)) {
        readyForTesting++;
      }
    }

    newCount += untrackedNew;
    const masteredCount = youngCount + matureCount;
    const masteryPercent = total === 0 ? 0 : Math.round((masteredCount / total) * 100);

    result.set(deckId, {
      total,
      newCount,
      learningCount,
      testingCount,
      youngCount,
      matureCount,
      relearningCount,
      masteredCount,
      masteryPercent,
      readyForReview,
      readyForTesting,
    });
  }

  return result;
}
