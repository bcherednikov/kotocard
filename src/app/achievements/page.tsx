'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { getUserAchievements } from '@/lib/analytics/queries';
import { ACHIEVEMENTS, CATEGORY_LABELS } from '@/lib/analytics/definitions';
import type { UserAchievementRow, AchievementCategory, AchievementContext } from '@/lib/analytics/types';

export default function AchievementsPage() {
  const { user, profile } = useAuth();
  const [unlocked, setUnlocked] = useState<UserAchievementRow[]>([]);
  const [context, setContext] = useState<Partial<AchievementContext>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  async function loadAchievements() {
    if (!user) return;
    try {
      const [achievements, { getActivityTotals, getDecksCompletedCount, getStreakData }] = await Promise.all([
        getUserAchievements(supabase, user.id),
        import('@/lib/analytics/queries'),
      ]);

      const [totals, decksCompleted, streak] = await Promise.all([
        getActivityTotals(supabase, user.id),
        getDecksCompletedCount(supabase, user.id),
        getStreakData(supabase, user.id),
      ]);

      const { count: totalMastered } = await supabase
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['young', 'mature']);

      setUnlocked(achievements);
      setContext({
        totalMastered: totalMastered ?? 0,
        totalReviews: totals.totalReviews,
        totalStudySessions: totals.totalStudySessions,
        totalWordsStudied: totals.totalWordsStudied,
        totalTestsPassed: totals.totalTestsPassed,
        totalDictationsPassed: totals.totalDictationsPassed,
        totalChoicePassed: totals.totalChoicePassed,
        totalAudioPassed: totals.totalAudioPassed,
        daysActive: totals.daysActive,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        decksCompleted,
        perfectTestSessions: totals.perfectTestSessions,
      });
    } catch (err) {
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  }

  const unlockedIds = new Set(unlocked.map((a) => a.achievement_id));
  const unlockedMap = new Map(unlocked.map((a) => [a.achievement_id, a]));

  // Group by category
  const categories = new Map<AchievementCategory, typeof ACHIEVEMENTS>();
  for (const a of ACHIEVEMENTS) {
    const list = categories.get(a.category) ?? [];
    list.push(a);
    categories.set(a.category, list);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
              ← На главную
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Достижения</h1>
            <p className="text-gray-600 mt-1">
              Разблокировано: {unlocked.length} из {ACHIEVEMENTS.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl">{'\uD83C\uDFC6'}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="w-full h-3 bg-gray-200 rounded-full mb-10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
            style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>

        {/* Categories */}
        {Array.from(categories.entries()).map(([category, achievements]) => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((def) => {
                const isUnlocked = unlockedIds.has(def.id);
                const ua = unlockedMap.get(def.id);
                const progress = def.getProgress && context
                  ? def.getProgress(context as AchievementContext)
                  : undefined;
                const progressMax = def.progressMax;

                return (
                  <div
                    key={def.id}
                    className={`rounded-xl p-4 border-2 transition ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`text-3xl flex-shrink-0 ${
                          isUnlocked ? '' : 'grayscale opacity-40'
                        }`}
                      >
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold ${
                              isUnlocked ? 'text-gray-900' : 'text-gray-500'
                            }`}
                          >
                            {def.title}
                          </h3>
                          {isUnlocked && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          {def.description}
                        </p>
                        {ua && (
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(ua.unlocked_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                        {!isUnlocked && progressMax && progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>{progress}/{progressMax}</span>
                              <span>{Math.round((progress / progressMax) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-400 rounded-full transition-all"
                                style={{ width: `${(progress / progressMax) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
