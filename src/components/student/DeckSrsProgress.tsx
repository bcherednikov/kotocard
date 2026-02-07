'use client';

import type { DeckSrsStats } from '@/lib/srs/types';

type DeckSrsProgressProps = {
  stats: DeckSrsStats;
  variant?: 'default' | 'onDark';
};

export function DeckSrsProgress({ stats, variant = 'default' }: DeckSrsProgressProps) {
  const isDark = variant === 'onDark';
  const { total, newCount, learningCount, testingCount, youngCount, matureCount, relearningCount, masteredCount, masteryPercent } = stats;

  if (total === 0) return null;

  const segments = [
    { count: matureCount, color: 'bg-green-700', label: 'mature' },
    { count: youngCount, color: 'bg-green-400', label: 'young' },
    { count: testingCount, color: 'bg-orange-400', label: 'testing' },
    { count: learningCount + relearningCount, color: 'bg-yellow-400', label: 'learning' },
    { count: newCount, color: 'bg-gray-300', label: 'new' },
  ];

  return (
    <div className="min-w-0">
      <div className={`flex gap-4 mb-3`}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-green-50'
          }`}
        >
          <span className="text-xl">📝</span>
          <div>
            <div className={`text-xs ${isDark ? 'text-blue-100' : 'text-gray-600'}`}>Выучено</div>
            <div className={`font-bold ${isDark ? 'text-white' : 'text-green-800'}`}>
              {masteredCount}
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-50'
          }`}
        >
          <span className="text-xl">📚</span>
          <div>
            <div className={`text-xs ${isDark ? 'text-blue-100' : 'text-gray-600'}`}>Всего</div>
            <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {total}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <div
          className={`flex justify-between text-xs mb-1 ${isDark ? 'text-blue-100' : 'text-gray-600'}`}
        >
          <span>Прогресс изучения</span>
          <span>{masteryPercent}%</span>
        </div>
        <div
          className={`w-full rounded-full h-2 overflow-hidden flex ${
            isDark ? 'bg-white/30' : 'bg-gray-200'
          }`}
        >
          {segments.map((seg) => {
            if (seg.count === 0) return null;
            const widthPercent = (seg.count / total) * 100;
            return (
              <div
                key={seg.label}
                className={`${seg.color} h-2 transition-all`}
                style={{ width: `${widthPercent}%` }}
                title={`${seg.label}: ${seg.count}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
