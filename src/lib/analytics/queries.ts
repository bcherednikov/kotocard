import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalyticsPeriod,
  DailyActivityRow,
  PeriodAnalytics,
  StreakData,
  TodayProgress,
  Last7Days,
  UserAchievementRow,
} from './types';
import { DAILY_GOAL } from './definitions';

// ── Date helpers ──

function getDateRange(period: AnalyticsPeriod): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case 'week': start.setDate(start.getDate() - 7); break;
    case 'month': start.setMonth(start.getMonth() - 1); break;
    case '3months': start.setMonth(start.getMonth() - 3); break;
    case 'year': start.setFullYear(start.getFullYear() - 1); break;
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ── Daily Activity ──

export async function getDailyActivityRange(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyActivityRow[]> {
  const { data, error } = await supabase
    .from('daily_activity')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', startDate)
    .lte('activity_date', endDate)
    .order('activity_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DailyActivityRow[];
}

export async function getTodayActivity(
  supabase: SupabaseClient,
  userId: string
): Promise<TodayProgress> {
  const today = todayStr();
  const { data, error } = await supabase
    .from('daily_activity')
    .select('words_studied, reviews_completed')
    .eq('user_id', userId)
    .eq('activity_date', today)
    .maybeSingle();

  if (error) throw error;

  const wordsStudied = data?.words_studied ?? 0;
  const reviewsCompleted = data?.reviews_completed ?? 0;
  const total = wordsStudied + reviewsCompleted;

  return {
    wordsStudied,
    reviewsCompleted,
    total,
    goal: DAILY_GOAL,
    completed: total >= DAILY_GOAL,
  };
}

export async function getLast7Days(
  supabase: SupabaseClient,
  userId: string
): Promise<Last7Days[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);

  const rows = await getDailyActivityRange(
    supabase,
    userId,
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );

  const rowMap = new Map<string, DailyActivityRow>();
  for (const r of rows) rowMap.set(r.activity_date, r);

  const result: Last7Days[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const row = rowMap.get(dateStr);
    const total = (row?.words_studied ?? 0) + (row?.reviews_completed ?? 0);
    result.push({
      date: dateStr,
      dayLabel: DAY_LABELS[d.getDay()],
      completed: total >= DAILY_GOAL,
    });
  }

  return result;
}

// ── Period Analytics ──

export async function getAnalyticsForPeriod(
  supabase: SupabaseClient,
  userId: string,
  period: AnalyticsPeriod
): Promise<PeriodAnalytics> {
  const { start, end } = getDateRange(period);
  const rows = await getDailyActivityRange(supabase, userId, start, end);

  let wordsLearned = 0, wordsStudied = 0, reviewsCompleted = 0;
  let testsPassed = 0, dictationsPassed = 0, audioPassed = 0;
  let studySessions = 0;
  let bestDay: { date: string; count: number } | null = null;

  for (const row of rows) {
    wordsLearned += row.words_learned;
    wordsStudied += row.words_studied;
    reviewsCompleted += row.reviews_completed;
    testsPassed += row.tests_passed;
    dictationsPassed += row.dictation_tests_passed;
    audioPassed += row.audio_tests_passed;
    studySessions += row.study_sessions;

    const dayTotal = row.words_studied + row.reviews_completed;
    if (!bestDay || dayTotal > bestDay.count) {
      bestDay = { date: row.activity_date, count: dayTotal };
    }
  }

  // Count active days (any activity)
  const daysActive = rows.filter(
    (r) => r.words_studied + r.reviews_completed + r.tests_passed > 0
  ).length;

  // Decks completed — query user_cards
  const decksCompleted = await getDecksCompletedCount(supabase, userId);

  return {
    wordsLearned,
    wordsStudied,
    reviewsCompleted,
    testsPassed,
    dictationsPassed,
    audioPassed,
    studySessions,
    daysActive,
    decksCompleted,
    bestDay: bestDay && bestDay.count > 0 ? bestDay : null,
  };
}

// ── Decks Completed ──

export async function getDecksCompletedCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // Get distinct decks this user has cards in
  const { data: userDecks, error: udErr } = await supabase
    .from('user_cards')
    .select('deck_id')
    .eq('user_id', userId);

  if (udErr) throw udErr;
  if (!userDecks || userDecks.length === 0) return 0;

  const deckIds = [...new Set(userDecks.map((r) => r.deck_id))];

  // Get total card counts per deck
  const { data: allCards, error: acErr } = await supabase
    .from('cards')
    .select('id, deck_id')
    .in('deck_id', deckIds);

  if (acErr) throw acErr;

  const cardsByDeck = new Map<string, number>();
  for (const c of allCards ?? []) {
    cardsByDeck.set(c.deck_id, (cardsByDeck.get(c.deck_id) ?? 0) + 1);
  }

  // Get mastered card counts per deck
  const { data: masteredCards, error: mcErr } = await supabase
    .from('user_cards')
    .select('deck_id')
    .eq('user_id', userId)
    .in('status', ['young', 'mature']);

  if (mcErr) throw mcErr;

  const masteredByDeck = new Map<string, number>();
  for (const c of masteredCards ?? []) {
    masteredByDeck.set(c.deck_id, (masteredByDeck.get(c.deck_id) ?? 0) + 1);
  }

  let completed = 0;
  for (const deckId of deckIds) {
    const total = cardsByDeck.get(deckId) ?? 0;
    const mastered = masteredByDeck.get(deckId) ?? 0;
    if (total > 0 && mastered >= total) completed++;
  }

  return completed;
}

// ── Streak ──

export async function getStreakData(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakData> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak, last_active_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    currentStreak: data?.current_streak ?? 0,
    longestStreak: data?.longest_streak ?? 0,
    lastActiveDate: data?.last_active_date ?? null,
  };
}

export async function upsertStreakData(
  supabase: SupabaseClient,
  userId: string,
  streak: StreakData
): Promise<void> {
  const { error } = await supabase
    .from('user_streaks')
    .upsert({
      user_id: userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_active_date: streak.lastActiveDate,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ── Achievements ──

export async function getUserAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAchievementRow[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserAchievementRow[];
}

export async function unlockAchievement(
  supabase: SupabaseClient,
  userId: string,
  achievementId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievementId, unlocked_at: new Date().toISOString() },
      { onConflict: 'user_id,achievement_id' }
    );

  if (error) throw error;
}

// ── Aggregate totals from daily_activity ──

export async function getActivityTotals(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalWordsStudied: number;
  totalWordsLearned: number;
  totalReviews: number;
  totalTestsPassed: number;
  totalDictationsPassed: number;
  totalChoicePassed: number;
  totalAudioPassed: number;
  totalStudySessions: number;
  daysActive: number;
  perfectTestSessions: number;
}> {
  const { data, error } = await supabase
    .from('daily_activity')
    .select('words_studied, words_learned, reviews_completed, tests_passed, tests_failed, choice_tests_passed, audio_tests_passed, dictation_tests_passed, study_sessions')
    .eq('user_id', userId);

  if (error) throw error;

  const rows = data ?? [];
  let totalWordsStudied = 0, totalWordsLearned = 0, totalReviews = 0;
  let totalTestsPassed = 0, totalDictationsPassed = 0;
  let totalChoicePassed = 0, totalAudioPassed = 0;
  let totalStudySessions = 0;
  let daysActive = 0;
  let perfectTestSessions = 0;

  for (const row of rows) {
    totalWordsStudied += row.words_studied;
    totalWordsLearned += row.words_learned;
    totalReviews += row.reviews_completed;
    totalTestsPassed += row.tests_passed;
    totalDictationsPassed += row.dictation_tests_passed;
    totalChoicePassed += row.choice_tests_passed;
    totalAudioPassed += row.audio_tests_passed;
    totalStudySessions += row.study_sessions;

    if (row.words_studied + row.reviews_completed + row.tests_passed > 0) {
      daysActive++;
    }

    // A "perfect test session" is a day where tests_passed > 0 and tests_failed = 0
    if (row.tests_passed > 0 && row.tests_failed === 0) {
      perfectTestSessions++;
    }
  }

  return {
    totalWordsStudied,
    totalWordsLearned,
    totalReviews,
    totalTestsPassed,
    totalDictationsPassed,
    totalChoicePassed,
    totalAudioPassed,
    totalStudySessions,
    daysActive,
    perfectTestSessions,
  };
}
