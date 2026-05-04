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
  created_at: string;
};

type DeckWithStats = Deck & { stats: DeckSrsStats };

const emptySrsStats: DeckSrsStats = {
  total: 0, newCount: 0, learningCount: 0, testingCount: 0,
  youngCount: 0, matureCount: 0, relearningCount: 0,
  masteredCount: 0, masteryPercent: 0, readyForReview: 0, readyForTesting: 0,
};

export default function DecksPage() {
  const { user, profile } = useAuth();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) loadDecks();
  }, [user, profile]);

  async function loadDecks() {
    if (!user) return;

    try {
      const { data, error: queryErr } = await supabase
        .from('decks')
        .select('id, name, description, tags, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (queryErr) throw queryErr;

      if (!data?.length) {
        setDecks([]);
        setLoading(false);
        return;
      }

      const statsMap = await getDecksSrsStats(supabase, user.id, data.map(d => d.id));

      setDecks(data.map(d => ({
        ...d,
        stats: statsMap.get(d.id) ?? emptySrsStats,
      })));
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
          <div className="text-5xl mb-4">&#10060;</div>
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
        <div data-testid="my-decks" className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мои наборы</h1>
            <p className="text-gray-700 mt-1">
              Управляйте своими наборами карточек
            </p>
          </div>
          <Link
            href="/decks/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Создать набор
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет наборов
            </h2>
            <p className="text-gray-700 mb-6">
              Создайте первый набор карточек для обучения
            </p>
            <Link
              href="/decks/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Создать первый набор
            </Link>
          </div>
        ) : (
          <div data-testid="decks-list" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div
                key={deck.id}
                data-testid="deck-card"
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex flex-col"
              >
                <Link href={`/decks/${deck.id}`} className="flex-1 block">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                  <div className="mb-3">
                    <DeckSrsProgress stats={deck.stats} />
                  </div>
                  {deck.tags && deck.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {deck.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Создан: {new Date(deck.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </Link>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <Link
                    href={`/decks/${deck.id}/edit`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Изменить
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
