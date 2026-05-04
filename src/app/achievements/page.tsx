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

  const categories = new Map<AchievementCategory, typeof ACHIEVEMENTS>();
  for (const a of ACHIEVEMENTS) {
    const list = categories.get(a.category) ?? [];
    list.push(a);
    categories.set(a.category, list);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
  }

  const percentage = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);

  return (
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[#057A55] hover:text-[#065f46] font-medium text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            На главную
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Достижения</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Разблокировано: {unlocked.length} из {ACHIEVEMENTS.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl">🏆</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{percentage}%</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }}
            />
          </div>
        </div>

        {Array.from(categories.entries()).map(([category, achievements]) => (
          <section key={category} className="mb-7">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    className={`rounded-2xl p-4 border transition ${
                      isUnlocked
                        ? 'bg-amber-50 border-amber-200 shadow-sm'
                        : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                            {def.title}
                          </h3>
                          {isUnlocked && (
                            <span className="text-xs bg-[#057A55]/10 text-[#057A55] px-2 py-0.5 rounded-full font-medium">✓</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
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
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-300 rounded-full transition-all"
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
