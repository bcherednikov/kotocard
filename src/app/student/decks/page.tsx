'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { getDecksSrsStats, getReviewCount } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
};

type DeckWithStats = Deck & { stats: DeckSrsStats };

export default function StudentDecksPage() {
  const { profile } = useAuth();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [reviewReady, setReviewReady] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) loadDecks();
  }, [profile]);

  async function loadDecks() {
    if (!profile) return;

    try {
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (decksError) throw decksError;

      if (!decksData?.length) {
        setDecks([]);
        setError(null);
        setLoading(false);
        return;
      }

      const [statsMap, reviewCount] = await Promise.all([
        getDecksSrsStats(supabase, profile.id, decksData.map((d) => d.id)),
        getReviewCount(supabase, profile.id),
      ]);

      const decksWithStats = decksData.map((deck) => ({
        ...deck,
        stats: statsMap.get(deck.id) ?? {
          total: 0, newCount: 0, learningCount: 0, testingCount: 0,
          youngCount: 0, matureCount: 0, relearningCount: 0,
          masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
        },
      }));

      setDecks(decksWithStats);
      setReviewReady(reviewCount);
      setError(null);
    } catch (err: any) {
      console.error('Error loading decks:', err);
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
            onClick={() => loadDecks()}
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
            Выбери набор карточек для изучения
          </p>
        </div>

        {decks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет наборов
            </h2>
            <p className="text-gray-700">
              Попроси родителей создать наборы карточек для тебя
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Global review card */}
            {reviewReady > 0 && (
              <Link
                href="/student/review"
                className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105 border-4 border-yellow-400"
              >
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-3xl">🔄</div>
                    <h3 className="text-2xl font-bold">Повторение</h3>
                  </div>
                  <p className="text-orange-100 text-sm mb-4">
                    Карточки из всех наборов, которые пора повторить
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {reviewReady} к повторению
                    </span>
                    <div className="text-2xl">→</div>
                  </div>
                </div>
              </Link>
            )}

            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/student/decks/${deck.id}`}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105"
              >
                <div className="text-white">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold flex-1">{deck.name}</h3>
                    <span className="text-2xl">→</span>
                  </div>
                  {deck.description && (
                    <p className="text-blue-100 text-sm mb-4 line-clamp-2">
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
  );
}
