'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Child = {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

type TestSession = {
  id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  completed_at: string | null;
};

type Period = 'all' | 'week' | 'day';

type ChildStats = {
  childName: string;
  studiedCardsCount: number;
  sessions: TestSession[];
  totalTests: number;
  totalCorrect: number;
  totalQuestions: number;
  averageScore: number;
};

export default function AdminStatsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [parentToken, setParentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin') {
        router.push('/student');
        return;
      }
      loadChildren();
    }
  }, [profile, router]);

  useEffect(() => {
    if (profile?.role === 'admin' && selectedChildId && parentToken) {
      loadChildStats(parentToken);
    } else {
      setStats(null);
    }
  }, [selectedChildId, period, profile, parentToken]);

  async function loadChildren() {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Сессия не найдена');

      const response = await fetch('/api/get-children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: profile!.family_id,
          parentToken: session.access_token,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ошибка загрузки');

      const list = result.children || [];
      setChildren(list);
      setParentToken(session.access_token);
      if (list.length > 0 && !selectedChildId) {
        setSelectedChildId(list[0].id);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки детей:', err);
      setError(err.message || 'Ошибка загрузки детей');
    } finally {
      setLoading(false);
    }
  }

  async function loadChildStats(token: string) {
    if (!selectedChildId || !profile) return;

    try {
      setStatsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/child-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          period,
          parentToken: token,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки статистики');

      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('Ошибка загрузки статистики:', err);
      setStats(null);
      setError(err.message || 'Ошибка загрузки статистики');
    } finally {
      setStatsLoading(false);
    }
  }

  const periodLabels: Record<Period, string> = {
    all: 'За всё время',
    week: 'За неделю',
    day: 'За день',
  };

  const modeLabel = (mode: string) =>
    mode === 'random_mix' ? 'Случайный микс' : mode === 'by_deck' ? 'По теме' : mode;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-xl text-gray-800 mb-6">{error}</p>
        <Link href="/admin/decks" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Назад к наборам
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/decks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📊 Результаты детей
        </h1>
        <p className="text-gray-700 mb-8">
          Статистика обучения и проверок по каждому ребёнку
        </p>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет детей
            </h2>
            <p className="text-gray-700 mb-6">
              Добавьте профили детей, чтобы видеть их результаты
            </p>
            <Link
              href="/admin/children/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Добавить ребёнка
            </Link>
          </div>
        ) : (
          <>
            {/* Навигация по детям */}
            <div className="flex flex-wrap gap-2 mb-6">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-5 py-3 rounded-xl font-semibold transition ${
                    selectedChildId === child.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  👤 {child.display_name}
                </button>
              ))}
            </div>

            {selectedChildId && (
              <>
                {/* Период */}
                <div className="flex gap-2 mb-6">
                  {(['all', 'week', 'day'] as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-6 py-3 rounded-xl font-semibold transition ${
                        period === p
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </div>

                {statsLoading ? (
                  <div className="py-16 text-center">
                    <p className="text-xl text-gray-800">Загрузка статистики...</p>
                  </div>
                ) : stats ? (
                  <>
                    {/* Последняя активность */}
                    {children.find((c) => c.id === selectedChildId)?.last_sign_in_at && (
                      <p className="text-sm text-gray-500 mb-4">
                        Последний вход:{' '}
                        {new Date(
                          children.find((c) => c.id === selectedChildId)!.last_sign_in_at!
                        ).toLocaleString('ru-RU')}
                      </p>
                    )}

                    {/* Карточки статистики — как у ученика */}
                    <div className="grid md:grid-cols-5 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-center text-white">
                        <div className="text-4xl mb-2">📚</div>
                        <div className="text-3xl font-bold">{stats.studiedCardsCount}</div>
                        <div className="text-blue-100 text-sm">Изучено слов</div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="text-3xl font-bold text-purple-600">{stats.totalTests}</div>
                        <div className="text-gray-700 text-sm">Всего тестов</div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-4xl mb-2">✅</div>
                        <div className="text-3xl font-bold text-green-600">{stats.totalCorrect}</div>
                        <div className="text-gray-700 text-sm">Правильных ответов</div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-4xl mb-2">📝</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
                        <div className="text-gray-700 text-sm">Всего вопросов</div>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                        <div className="text-4xl mb-2">⭐</div>
                        <div className="text-3xl font-bold text-orange-600">{stats.averageScore}%</div>
                        <div className="text-gray-700 text-sm">Средний результат</div>
                      </div>
                    </div>

                    {/* История проверок */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        📋 История проверок — {stats.childName}
                      </h2>

                      {stats.sessions.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎓</div>
                          <p className="text-xl text-gray-700">
                            За выбранный период проверок нет
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {stats.sessions.map((session, index) => {
                            const percentage = Math.round(
                              (session.correct_count / session.total_questions) * 100
                            );
                            const isPerfect = session.correct_count === session.total_questions;
                            const isGood = percentage >= 70;
                            const date = new Date(session.completed_at!);
                            const isRecent =
                              Date.now() - date.getTime() < 24 * 60 * 60 * 1000;

                            return (
                              <div
                                key={session.id}
                                className={`p-6 rounded-xl border-2 transition-all ${
                                  isPerfect
                                    ? 'bg-green-50 border-green-200'
                                    : isGood
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-orange-50 border-orange-200'
                                }`}
                              >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <div className="text-5xl">
                                    {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
                                  </div>
                                  <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-xl font-bold text-gray-900">
                                        Проверка #{stats.totalTests - index}
                                      </h3>
                                      {isRecent && (
                                        <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                                          НОВАЯ
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-2">
                                      <span>
                                        📅{' '}
                                        {date.toLocaleDateString('ru-RU', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                        })}
                                      </span>
                                      <span>
                                        🕐{' '}
                                        {date.toLocaleTimeString('ru-RU', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                      <span>🎲 {modeLabel(session.mode)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-2xl font-bold text-green-600">
                                        {session.correct_count}
                                      </span>
                                      <span className="text-gray-500">/</span>
                                      <span className="text-xl font-semibold text-gray-800">
                                        {session.total_questions}
                                      </span>
                                      <div className="flex-1 max-w-xs">
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all ${
                                              isPerfect
                                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                                : isGood
                                                ? 'bg-gradient-to-r from-blue-400 to-purple-600'
                                                : 'bg-gradient-to-r from-orange-400 to-red-600'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className="text-2xl font-bold text-purple-600">
                                        {percentage}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-800">{error}</p>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
