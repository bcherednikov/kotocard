import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailyActivityIncrements } from './types';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function trackActivity(
  supabase: SupabaseClient,
  userId: string,
  increments: Partial<DailyActivityIncrements>
): Promise<void> {
  try {
    await supabase.rpc('increment_daily_activity', {
      p_user_id: userId,
      p_date: todayStr(),
      p_words_studied: increments.words_studied ?? 0,
      p_words_learned: increments.words_learned ?? 0,
      p_reviews_completed: increments.reviews_completed ?? 0,
      p_tests_passed: increments.tests_passed ?? 0,
      p_tests_failed: increments.tests_failed ?? 0,
      p_choice_tests_passed: increments.choice_tests_passed ?? 0,
      p_audio_tests_passed: increments.audio_tests_passed ?? 0,
      p_dictation_tests_passed: increments.dictation_tests_passed ?? 0,
      p_study_sessions: increments.study_sessions ?? 0,
    });
  } catch (err) {
    console.error('trackActivity error:', err);
  }
}

/**
 * Track activity + update streak + check achievements in background.
 * Does not block the caller.
 */
export function trackActivityInBackground(
  supabase: SupabaseClient,
  userId: string,
  increments: Partial<DailyActivityIncrements>
): void {
  (async () => {
    await trackActivity(supabase, userId, increments);

    // Lazy-import to avoid circular deps
    const { recalculateStreak } = await import('./streak');
    await recalculateStreak(supabase, userId);

    const { checkAndUnlockAchievements } = await import('./achievements');
    await checkAndUnlockAchievements(supabase, userId);
  })().catch((err) => console.error('Background tracking error:', err));
}
