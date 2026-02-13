import type { SupabaseClient } from '@supabase/supabase-js';
import type { AchievementContext } from './types';
import { ACHIEVEMENTS } from './definitions';
import { getStreakData, getUserAchievements, unlockAchievement, getActivityTotals, getDecksCompletedCount } from './queries';

/**
 * Build the full context needed to evaluate achievement conditions.
 */
async function buildAchievementContext(
  supabase: SupabaseClient,
  userId: string
): Promise<AchievementContext> {
  const [streakData, unlocked, totals, decksCompleted] = await Promise.all([
    getStreakData(supabase, userId),
    getUserAchievements(supabase, userId),
    getActivityTotals(supabase, userId),
    getDecksCompletedCount(supabase, userId),
  ]);

  // Get total mastered from user_cards
  const { count: totalMastered } = await supabase
    .from('user_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['young', 'mature']);

  const unlockedIds = new Set(unlocked.map((a) => a.achievement_id));

  return {
    totalMastered: totalMastered ?? 0,
    totalReviews: totals.totalReviews,
    totalStudySessions: totals.totalStudySessions,
    totalWordsStudied: totals.totalWordsStudied,
    totalTestsPassed: totals.totalTestsPassed,
    totalDictationsPassed: totals.totalDictationsPassed,
    totalChoicePassed: totals.totalChoicePassed,
    totalAudioPassed: totals.totalAudioPassed,
    daysActive: totals.daysActive,
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    decksCompleted,
    perfectTestSessions: totals.perfectTestSessions,
    currentHour: new Date().getHours(),
    unlockedIds,
  };
}

/**
 * Check all achievement definitions and unlock any new ones.
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const ctx = await buildAchievementContext(supabase, userId);
    const newlyUnlocked: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (ctx.unlockedIds.has(achievement.id)) continue;

      try {
        if (achievement.condition(ctx)) {
          await unlockAchievement(supabase, userId, achievement.id);
          newlyUnlocked.push(achievement.id);
        }
      } catch {
        // Skip individual achievement errors
      }
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('checkAndUnlockAchievements error:', err);
    return [];
  }
}
