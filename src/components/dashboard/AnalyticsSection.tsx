'use client';

import { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsPeriod, PeriodAnalytics } from '@/lib/analytics/types';
import { getAnalyticsForPeriod } from '@/lib/analytics/queries';

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: '3months', label: '3 месяца' },
  { key: 'year', label: 'Год' },
];

type Props = {
  supabase: SupabaseClient;
  userId: string;
};

export function AnalyticsSection({ supabase, userId }: Props) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [data, setData] = useState<PeriodAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const result = await getAnalyticsForPeriod(supabase, userId, period);
      setData(result);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }

  const metrics = data
    ? [
        { icon: '\uD83C\uDF3F', value: data.wordsLearned, label: 'Выучено слов' },
        { icon: '\uD83C\uDFAF', value: data.testsPassed, label: 'Тестов пройдено' },
        { icon: '\u270D\uFE0F', value: data.dictationsPassed, label: 'Диктантов пройдено' },
        { icon: '\uD83C\uDFA7', value: data.audioPassed, label: 'Аудио пройдено' },
        { icon: '\uD83D\uDD04', value: data.reviewsCompleted, label: 'Повторений' },
        { icon: '\uD83D\uDCDA', value: data.decksCompleted, label: 'Наборов завершено' },
        { icon: '\uD83D\uDCC5', value: data.daysActive, label: 'Дней активности' },
        { icon: '\uD83C\uDFC6', value: data.bestDay?.count ?? 0, label: 'Лучший день' },
      ]
    : [];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Аналитика</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                period === p.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{m.icon}</span>
                <span className="text-2xl font-bold text-gray-900">{m.value}</span>
              </div>
              <div className="text-xs text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
