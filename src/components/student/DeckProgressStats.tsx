'use client';

type DeckProgressStatsProps = {
  studiedCount: number;
  totalCount: number;
  /** Use on gradient/dark backgrounds (e.g. deck cover, dashboard cards) */
  variant?: 'default' | 'onDark';
};

export function DeckProgressStats({
  studiedCount,
  totalCount,
  variant = 'default'
}: DeckProgressStatsProps) {
  const percent =
    totalCount === 0 ? 0 : Math.round(Math.min(100, (studiedCount / totalCount) * 100));
  const isDark = variant === 'onDark';

  return (
    <div className="min-w-0">
      <div className={`flex gap-4 mb-4 ${isDark ? 'mb-3' : ''}`}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-50'
          }`}
        >
          <span className="text-xl">📝</span>
          <div>
            <div className={`text-xs ${isDark ? 'text-blue-100' : 'text-gray-600'}`}>Изучено</div>
            <div className={`font-bold ${isDark ? 'text-white' : 'text-blue-800'}`}>
              {studiedCount}
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
              {totalCount}
            </div>
          </div>
        </div>
      </div>
      <div className={isDark ? 'mt-2' : 'mt-4'}>
        <div
          className={`flex justify-between text-xs mb-1 ${isDark ? 'text-blue-100' : 'text-gray-600'}`}
        >
          <span>Прогресс изучения</span>
          <span>{percent}%</span>
        </div>
        <div
          className={`w-full rounded-full h-2 overflow-hidden ${
            isDark ? 'bg-white/30' : 'bg-gray-200'
          }`}
        >
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all min-w-0 max-w-full"
            style={{
              width: totalCount === 0 ? 0 : `${Math.min(100, (studiedCount / totalCount) * 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}
