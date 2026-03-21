'use client';

import type { StreakData, TodayProgress, Last7Days } from '@/lib/analytics/types';
import { STREAK_MILESTONES } from '@/lib/analytics/definitions';

type Props = {
  streak: StreakData;
  today: TodayProgress;
  last7: Last7Days[];
};

export function StreakWidget({ streak, today, last7 }: Props) {
  const hasStreak = streak.currentStreak > 0;
  const todayPercent = Math.min(100, Math.round((today.total / today.goal) * 100));

  return (
    <div
      className={`rounded-xl p-5 shadow-lg mb-8 ${
        hasStreak
          ? 'bg-orange-500 bg-gradient-to-br from-orange-500 to-red-600 text-white'
          : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
      }`}
    >
      {/* Header: streak + record */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{hasStreak ? '\uD83D\uDD25' : '\u2744\uFE0F'}</span>
          <div>
            <div className="text-2xl font-bold">
              {streak.currentStreak} {streak.currentStreak === 1 ? 'день' : getDayWord(streak.currentStreak)}
            </div>
            <div className={`text-sm ${hasStreak ? 'text-orange-100' : 'text-gray-500'}`}>
              {hasStreak ? 'Серия повторений' : 'Начни серию сегодня!'}
            </div>
          </div>
        </div>
        {streak.longestStreak > 0 && (
          <div className={`text-right text-sm ${hasStreak ? 'text-orange-100' : 'text-gray-500'}`}>
            <div className="font-semibold">Рекорд</div>
            <div className="text-lg font-bold">{streak.longestStreak}</div>
          </div>
        )}
      </div>

      {/* Today's progress */}
      <div className="mb-4">
        <div className={`flex justify-between text-sm mb-1 ${hasStreak ? 'text-orange-100' : 'text-gray-500'}`}>
          <span>Сегодня</span>
          <span>{today.total}/{today.goal} слов</span>
        </div>
        <div className={`w-full h-3 rounded-full overflow-hidden ${hasStreak ? 'bg-white/20' : 'bg-gray-400/30'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              today.completed
                ? 'bg-green-400'
                : hasStreak
                ? 'bg-yellow-300'
                : 'bg-blue-400'
            }`}
            style={{ width: `${todayPercent}%` }}
          />
        </div>
      </div>

      {/* Last 7 days */}
      <div className="flex justify-between mb-4">
        {last7.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                day.completed
                  ? hasStreak
                    ? 'bg-yellow-300 text-orange-800'
                    : 'bg-green-400 text-green-900'
                  : hasStreak
                  ? 'bg-white/20 text-white/60'
                  : 'bg-gray-400/30 text-gray-500'
              }`}
            >
              {day.completed ? '\u2713' : '\u00B7'}
            </div>
            <span className={`text-xs ${hasStreak ? 'text-orange-100' : 'text-gray-500'}`}>
              {day.dayLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="flex items-center justify-between">
        {STREAK_MILESTONES.map((milestone, idx) => {
          const reached = streak.currentStreak >= milestone || streak.longestStreak >= milestone;
          const icons = ['\uD83D\uDD25', '\uD83D\uDD25\uD83D\uDD25', '\uD83D\uDC8E', '\uD83D\uDC51'];
          return (
            <div key={milestone} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                  reached
                    ? 'bg-yellow-300 text-yellow-900 shadow-lg'
                    : hasStreak
                    ? 'bg-white/15 text-white/40'
                    : 'bg-gray-400/20 text-gray-400'
                }`}
              >
                {reached ? icons[idx] : milestone}
              </div>
              <span className={`text-xs mt-1 ${hasStreak ? 'text-orange-100' : 'text-gray-500'}`}>
                {milestone} дн.
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getDayWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 19) return 'дней';
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дня';
  return 'дней';
}
