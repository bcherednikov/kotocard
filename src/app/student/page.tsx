'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { getDecksSrsStats } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
};

type DeckWithStats = Deck & { stats: DeckSrsStats };

export default function StudentDashboardPage() {
  const { profile } = useAuth();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [totalStats, setTotalStats] = useState({ mastered: 0, total: 0, percent: 0 });
  const [reviewReady, setReviewReady] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  // Refresh stats on tab focus
  useEffect(() => {
    if (!profile) return;
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    try {
      // Load decks
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (decksError) throw decksError;

      if (!decksData?.length) {
        setDecks([]);
        setTotalStats({ mastered: 0, total: 0, percent: 0 });
        setReviewReady(0);
        setLoading(false);
        return;
      }

      const [statsMap, reviewCountResult] = await Promise.all([
        getDecksSrsStats(supabase, profile.id, decksData.map((d) => d.id)),
        supabase
          .from('user_cards')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .neq('status', 'new'),
      ]);
      if (reviewCountResult.error) throw reviewCountResult.error;
      const reviewCount = reviewCountResult.count ?? 0;

      const decksWithStats = decksData.map((deck) => ({
        ...deck,
        stats: statsMap.get(deck.id) ?? {
          total: 0, newCount: 0, learningCount: 0, testingCount: 0,
          youngCount: 0, matureCount: 0, relearningCount: 0,
          masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
        },
      }));

      // Calculate totals
      let totalMastered = 0, totalCards = 0;
      for (const d of decksWithStats) {
        totalMastered += d.stats.masteredCount;
        totalCards += d.stats.total;
      }

      setDecks(decksWithStats);
      setTotalStats({
        mastered: totalMastered,
        total: totalCards,
        percent: totalCards === 0 ? 0 : Math.round((totalMastered / totalCards) * 100),
      });
      setReviewReady(reviewCount);
      setError(null);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
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

        {/* Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Твои результаты</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-3xl font-bold mb-1">{totalStats.mastered}</div>
              <div className="text-green-100 text-sm">Выучено слов</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-3xl font-bold mb-1">{totalStats.total}</div>
              <div className="text-blue-100 text-sm">Всего слов</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-3xl font-bold mb-1">{reviewReady}</div>
              <div className="text-orange-100 text-sm">Изучено слов</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-3xl font-bold mb-1">{totalStats.percent}%</div>
              <div className="text-purple-100 text-sm">Процент освоения</div>
            </div>
          </div>

          {reviewReady > 0 && (
            <Link
              href="/student/review"
              className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl p-4 text-center font-semibold hover:from-orange-600 hover:to-red-700 transition"
            >
              🔄 Повторить 10 случайных слов
            </Link>
          )}
        </div>

        {/* Decks */}
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
              {decks.map((deck) => (
                <Link
                  key={deck.id}
                  href={`/student/decks/${deck.id}`}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105"
                >
                  <div className="text-white">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold flex-1">{deck.name}</h3>
                      <span className="text-2xl">→</span>
                    </div>
                    {deck.description && (
                      <p className="text-blue-100 text-sm mb-3 line-clamp-2">
                        {deck.description}
                      </p>
                    )}
                    <DeckSrsProgress stats={deck.stats} variant="onDark" />
                    {deck.stats.readyForReview > 0 && (
                      <div className="mt-2 inline-block px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-semibold">
                        🔄 {deck.stats.readyForReview} к повторению
                      </div>
                    )}
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
