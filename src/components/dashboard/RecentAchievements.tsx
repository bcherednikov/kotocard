'use client';

import Link from 'next/link';
import type { UserAchievementRow } from '@/lib/analytics/types';
import { ACHIEVEMENTS } from '@/lib/analytics/definitions';

type Props = {
  achievements: UserAchievementRow[];
};

export function RecentAchievements({ achievements }: Props) {
  if (achievements.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Достижения</h2>
          <Link href="/achievements" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Все достижения \u2192
          </Link>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">{'\uD83C\uDFC6'}</div>
          <p className="text-gray-600 text-sm">
            Начни заниматься, чтобы получить первое достижение!
          </p>
        </div>
      </div>
    );
  }

  // Show last 3 achievements
  const recent = achievements.slice(0, 3);
  const defMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Достижения
          <span className="ml-2 text-sm font-normal text-gray-500">
            {achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </h2>
        <Link href="/achievements" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Все достижения \u2192
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recent.map((ua) => {
          const def = defMap.get(ua.achievement_id);
          if (!def) return null;
          const date = new Date(ua.unlocked_at);
          const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
          return (
            <div
              key={ua.id}
              className="flex-shrink-0 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 min-w-[160px]"
            >
              <div className="text-3xl mb-2">{def.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{def.title}</div>
              <div className="text-xs text-gray-500 mt-1">{dateStr}</div>
            </div>
          );
        })}
        {achievements.length > 3 && (
          <Link
            href="/achievements"
            className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-4 min-w-[120px] flex flex-col items-center justify-center hover:bg-gray-100 transition"
          >
            <div className="text-2xl text-gray-400 mb-1">+{achievements.length - 3}</div>
            <div className="text-xs text-gray-500">ещё</div>
          </Link>
        )}
      </div>
    </div>
  );
}
