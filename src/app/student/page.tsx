'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  _count?: number;
};

type Stats = {
  totalTests: number;
  correctAnswers: number;
  totalQuestions: number;
  averageScore: number;
  studiedCards: number;
};

export default function StudentDashboardPage() {
  const { profile } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  // Пересчитать статистику при возврате на вкладку (например, после изучения карточек)
  useEffect(() => {
    if (!profile) return;
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [profile]);

  async function loadData() {
    if (!profile) return;

    try {
      await Promise.all([
        loadDecks(),
        loadStats()
      ]);
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  async function loadDecks() {
    if (!profile) return;

    const { data: decksData, error: decksError } = await supabase
      .from('decks')
      .select('id, name, description, tags')
      .eq('family_id', profile.family_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (decksError) throw decksError;

    const decksWithCount = await Promise.all(
      (decksData || []).map(async (deck) => {
        const { count } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id);

        return {
          ...deck,
          _count: count || 0
        };
      })
    );

    setDecks(decksWithCount);
  }

  async function loadStats() {
    if (!profile) return;

    const { data: testsData, error: testsError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    if (testsError) throw testsError;

    const totalTests = testsData?.length || 0;
    const correctAnswers = testsData?.reduce((sum, s) => sum + s.correct_answers, 0) || 0;
    const totalQuestions = testsData?.reduce((sum, s) => sum + s.total_questions, 0) || 0;
    const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    const { data: cardsData, error: cardsError } = await supabase
      .from('card_progress')
      .select('card_id')
      .eq('user_id', profile.id)
      .gt('times_shown', 0);

    if (cardsError) throw cardsError;

    const uniqueCards = new Set(cardsData?.map(c => c.card_id) || []);

    setStats({
      totalTests,
      correctAnswers,
      totalQuestions,
      averageScore,
      studiedCards: uniqueCards.size
    });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Привет, {profile?.display_name}!
          </h1>
          <p className="text-xl text-gray-700">
            Добро пожаловать на твою учебную страницу
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Твои результаты</h2>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-3xl font-bold mb-1">{stats.studiedCards}</div>
                <div className="text-blue-100 text-sm">Изучено карточек</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-3xl font-bold mb-1">{stats.totalTests}</div>
                <div className="text-purple-100 text-sm">Пройдено тестов</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-3xl font-bold mb-1">{stats.correctAnswers}/{stats.totalQuestions}</div>
                <div className="text-green-100 text-sm">Правильных ответов</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-3xl font-bold mb-1">{stats.averageScore}%</div>
                <div className="text-orange-100 text-sm">Средний результат</div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link
              href="/student/test/history"
              className="flex-1 bg-white border-2 border-blue-600 text-blue-600 rounded-xl p-4 text-center font-semibold hover:bg-blue-50 transition"
            >
              📈 Посмотреть историю
            </Link>
            <Link
              href="/student/test"
              className="flex-1 bg-blue-600 text-white rounded-xl p-4 text-center font-semibold hover:bg-blue-700 transition"
            >
              🎯 Пройти тест
            </Link>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📚 Наборы для изучения</h2>
            <Link
              href="/student/decks"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Смотреть все →
            </Link>
          </div>

          {decks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Пока нет наборов
              </h3>
              <p className="text-gray-700">
                Попроси родителей создать наборы карточек для тебя
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/student/review/start"
                className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105"
              >
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-3xl">🔄</div>
                    <h3 className="text-xl font-bold">Режим повторения</h3>
                  </div>
                  <p className="text-orange-100 text-sm mb-3">
                    50 случайных карточек из всех наборов
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">🎲 Микс</span>
                    <div className="text-2xl">→</div>
                  </div>
                </div>
              </Link>

              {decks.slice(0, 5).map((deck) => (
                <Link
                  key={deck.id}
                  href={`/student/decks/${deck.id}`}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105"
                >
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-2">
                      {deck.name}
                    </h3>
                    {deck.description && (
                      <p className="text-blue-100 text-sm mb-3 line-clamp-2">
                        {deck.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        <span className="text-sm font-semibold">
                          {deck._count} {deck._count === 1 ? 'карточка' : 'карточек'}
                        </span>
                      </div>
                      <div className="text-2xl">→</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
