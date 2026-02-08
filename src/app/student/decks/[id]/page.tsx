'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ensureUserCardsExist, getDeckSrsStats } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
};

export default function StudentDeckPage() {
  const params = useParams();
  const { profile } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [stats, setStats] = useState<DeckSrsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const deckId = params.id as string;

  useEffect(() => {
    if (profile && deckId) {
      loadAll();
    }
  }, [profile, deckId]);

  async function loadAll() {
    if (!profile) return;
    try {
      // Load deck info
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;
      setDeck(data);

      // Ensure user_cards exist for all cards in this deck
      await ensureUserCardsExist(supabase, profile.id, deckId);

      // Load SRS stats
      const s = await getDeckSrsStats(supabase, profile.id, deckId);
      setStats(s);
    } catch (err) {
      console.error('Error loading deck:', err);
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

  if (!deck) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Набор не найден</h1>
        <Link
          href="/student/decks"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Вернуться к наборам
        </Link>
      </div>
    );
  }

  const studyCount = stats?.total ?? 0;
  const testCount = stats?.readyForTesting ?? 0;
  const reviewCount = stats ? (stats.total - stats.newCount) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Link
            href="/student/decks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>

        {/* Deck header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-4xl font-bold mb-3">
              {deck.name}
            </h1>
            {deck.description && (
              <p className="text-xl text-blue-100 mb-6">
                {deck.description}
              </p>
            )}
            {stats && (
              <div className="flex justify-center">
                <DeckSrsProgress stats={stats} variant="onDark" />
              </div>
            )}
          </div>
        </div>

        {/* Mode selection */}
        {stats !== null && stats.total === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              В этом наборе пока нет карточек
            </h2>
            <p className="text-gray-700">
              Попроси родителей добавить карточки в этот набор
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Study */}
            <Link
              href={`/student/decks/${deckId}/study`}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">📖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Изучение
                </h3>
                <p className="text-gray-700 mb-4">
                  Просмотри карточки и отметь что знаешь
                </p>
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold text-sm">
                  {studyCount} карт.
                </div>
              </div>
            </Link>

            {/* Testing */}
            <Link
              href={`/student/decks/${deckId}/test`}
              className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105 ${
                testCount === 0 ? 'opacity-60' : ''
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Тестирование
                </h3>
                <p className="text-gray-700 mb-4">
                  Пройди 3 теста чтобы выучить слово
                </p>
                <div className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                  testCount > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {testCount > 0 ? `${testCount} готово` : 'Нет карточек'}
                </div>
              </div>
            </Link>

            {/* Review */}
            <Link
              href={`/student/decks/${deckId}/review`}
              className={`bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105 ${
                reviewCount === 0 ? 'opacity-60' : ''
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🔄</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Повторение
                </h3>
                <p className="text-gray-700 mb-4">
                  Повтори 10 случайных изученных слов
                </p>
                <div className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                  reviewCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {reviewCount > 0 ? `${reviewCount} изучено` : 'Нет изученных'}
                </div>
              </div>
            </Link>

            {/* Dictation */}
            <Link
              href={`/student/decks/${deckId}/dictation`}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">✏️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Диктант
                </h3>
                <p className="text-gray-700 mb-4">
                  Послушай слово и запиши его правильно
                </p>
                <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-semibold text-sm">
                  {studyCount} слов
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
