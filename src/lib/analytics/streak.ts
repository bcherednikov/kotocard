import type { SupabaseClient } from '@supabase/supabase-js';
import { getDailyActivityRange, getStreakData, upsertStreakData } from './queries';
import { DAILY_GOAL } from './definitions';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Recalculate the user's streak from daily_activity rows.
 * Called after each trackActivity.
 */
export async function recalculateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const today = todayStr();

    // Load last 35 days of activity (enough for max 30 day streak + buffer)
    const start = new Date();
    start.setDate(start.getDate() - 35);
    const startStr = start.toISOString().split('T')[0];

    const rows = await getDailyActivityRange(supabase, userId, startStr, today);

    // Build a set of dates where the goal was met
    const activeDates = new Set<string>();
    for (const row of rows) {
      const total = row.words_studied + row.reviews_completed;
      if (total >= DAILY_GOAL) {
        activeDates.add(row.activity_date);
      }
    }

    // Count current streak: start from today (or yesterday if today not met yet), go backwards
    let currentStreak = 0;
    const checkDate = new Date(today);

    // If today's goal is met, include today
    if (activeDates.has(today)) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If yesterday is met, start counting from yesterday
      const yesterday = yesterdayStr();
      if (activeDates.has(yesterday)) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 2); // go to day before yesterday
      } else {
        // No streak
        currentStreak = 0;
      }
    }

    // Count backwards while consecutive days are met
    if (currentStreak > 0) {
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Get existing streak data for longest_streak
    const existing = await getStreakData(supabase, userId);
    const longestStreak = Math.max(existing.longestStreak, currentStreak);

    // Determine last active date
    const lastActiveDate = activeDates.has(today)
      ? today
      : activeDates.has(yesterdayStr())
      ? yesterdayStr()
      : existing.lastActiveDate;

    await upsertStreakData(supabase, userId, {
      currentStreak,
      longestStreak,
      lastActiveDate,
    });
  } catch (err) {
    console.error('recalculateStreak error:', err);
  }
}
