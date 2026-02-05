'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type TestSession = {
  id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  started_at: string;
  completed_at: string | null;
};

type Period = 'all' | 'week' | 'day';

export default function TestHistoryPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [studiedCardsCount, setStudiedCardsCount] = useState(0);
  const [period, setPeriod] = useState<Period>('all');

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, period]);

  async function loadHistory() {
    try {
      setLoading(true);
      
      // Определить временные рамки
      const now = new Date();
      let dateFilter: Date | null = null;
      
      if (period === 'day') {
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (period === 'week') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Загрузить тесты
      let testsQuery = supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .not('completed_at', 'is', null);
      
      if (dateFilter) {
        testsQuery = testsQuery.gte('completed_at', dateFilter.toISOString());
      }
      
      const { data: testsData, error: testsError } = await testsQuery.order('completed_at', { ascending: false });
      if (testsError) throw testsError;
      setSessions(testsData || []);

      // Загрузить изученные карточки
      let cardsQuery = supabase
        .from('card_progress')
        .select('card_id')
        .eq('user_id', user!.id)
        .gt('times_shown', 0);
      
      if (dateFilter) {
        cardsQuery = cardsQuery.gte('last_reviewed_at', dateFilter.toISOString());
      }
      
      const { data: cardsData, error: cardsError } = await cardsQuery;
      if (cardsError) throw cardsError;
      
      // Подсчитать уникальные карточки
      const uniqueCards = new Set(cardsData?.map(c => c.card_id) || []);
      setStudiedCardsCount(uniqueCards.size);

    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  const totalTests = sessions.length;
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_count, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const periodLabels = {
    all: 'За всё время',
    week: 'За неделю',
    day: 'За день'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📊 Твои результаты
            </h1>
            <p className="text-gray-700">
              Статистика обучения и проверок
            </p>
          </div>
          <Link
            href="/student/test"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition shadow-lg"
          >
            Новая проверка →
          </Link>
        </div>

        {/* Вкладки периодов */}
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

        {/* Общая статистика */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          {/* Изученные карточки - НОВОЕ */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-center text-white">
            <div className="text-4xl mb-2">📚</div>
            <div className="text-3xl font-bold">{studiedCardsCount}</div>
            <div className="text-blue-100 text-sm">Изучено слов</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-purple-600">{totalTests}</div>
            <div className="text-gray-700 text-sm">Всего тестов</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-600">{totalCorrect}</div>
            <div className="text-gray-700 text-sm">Правильных ответов</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-3xl font-bold text-blue-600">{totalQuestions}</div>
            <div className="text-gray-700 text-sm">Всего вопросов</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-orange-600">{averageScore}%</div>
            <div className="text-gray-700 text-sm">Средний результат</div>
          </div>
        </div>

        {/* История тестов */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 История проверок
          </h2>

          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎓</div>
              <p className="text-xl text-gray-700 mb-6">
                Ты ещё не прошёл ни одной проверки
              </p>
              <Link
                href="/student/test"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition shadow-lg"
              >
                Пройти первую проверку
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const percentage = Math.round((session.correct_count / session.total_questions) * 100);
                const isPerfect = session.correct_count === session.total_questions;
                const isGood = percentage >= 70;
                const date = new Date(session.completed_at!);
                const isRecent = Date.now() - date.getTime() < 24 * 60 * 60 * 1000; // Последние 24 часа

                return (
                  <div
                    key={session.id}
                    className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                      isPerfect ? 'bg-green-50 border-green-200' :
                      isGood ? 'bg-blue-50 border-blue-200' :
                      'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Иконка */}
                      <div className="text-5xl">
                        {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
                      </div>

                      {/* Информация */}
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            Проверка #{totalTests - index}
                          </h3>
                          {isRecent && (
                            <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                              НОВАЯ
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-3">
                          <span>
                            📅 {date.toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          <span>
                            🕐 {date.toLocaleTimeString('ru-RU', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                          <span>
                            🎲 {session.mode === 'random_mix' ? 'Случайный микс' : session.mode}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">
                              {session.correct_count}
                            </span>
                            <span className="text-gray-500">/</span>
                            <span className="text-xl font-semibold text-gray-800">
                              {session.total_questions}
                            </span>
                          </div>

                          <div className="flex-1 max-w-xs w-full">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isPerfect ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                  isGood ? 'bg-gradient-to-r from-blue-400 to-purple-600' :
                                  'bg-gradient-to-r from-orange-400 to-red-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-2xl font-bold text-purple-600">
                            {percentage}%
                          </div>
                        </div>
                      </div>

                      {/* Кнопка просмотра */}
                      <div className="w-full md:w-auto md:self-stretch flex md:items-center md:justify-end">
                        <Link
                          href={`/student/test/random-mix/complete?session=${session.id}`}
                          className="w-full md:w-auto text-center px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Мотивационный блок */}
        {sessions.length > 0 && averageScore < 80 && (
          <div className="mt-8 bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">💪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Продолжай тренироваться!
            </h3>
            <p className="text-gray-700 mb-4">
              Твой средний результат {averageScore}%. Ещё немного практики и будет {averageScore + 10}%+!
            </p>
            <Link
              href="/student/decks"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Продолжить обучение
            </Link>
          </div>
        )}

        {sessions.length > 0 && averageScore >= 80 && (
          <div className="mt-8 bg-gradient-to-r from-green-100 to-blue-100 border border-green-300 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🌟</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Отличная работа!
            </h3>
            <p className="text-gray-700">
              Твой средний результат {averageScore}%. Ты молодец! Продолжай в том же духе! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
