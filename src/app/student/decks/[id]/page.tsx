'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
};

export default function StudentDeckPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cardsCount, setCardsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const deckId = params.id as string;

  useEffect(() => {
    if (profile && deckId) {
      loadDeck();
      loadCardsCount();
    }
  }, [profile, deckId]);

  async function loadDeck() {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;

      setDeck(data);
    } catch (err) {
      console.error('Ошибка загрузки набора:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCardsCount() {
    try {
      const { count } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId);

      setCardsCount(count || 0);
    } catch (err) {
      console.error('Ошибка подсчёта карточек:', err);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Хлебные крошки */}
        <div className="mb-6">
          <Link
            href="/student/decks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>

        {/* Карточка набора */}
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
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <span className="text-2xl">📝</span>
              <span className="text-xl font-semibold">
                {cardsCount} {cardsCount === 1 ? 'карточка' : 'карточек'}
              </span>
            </div>
          </div>
        </div>

        {/* Режимы обучения */}
        {cardsCount === 0 ? (
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
            {/* Режим: RU → EN */}
            <Link
              href={`/student/decks/${deckId}/study?direction=ru_to_en`}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🇷🇺 → 🇬🇧</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Русский → Английский
                </h3>
                <p className="text-gray-700 mb-4">
                  Увидишь слово на русском, попробуй вспомнить перевод
                </p>
                <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
                  Начать учить →
                </div>
              </div>
            </Link>

            {/* Режим: EN → RU */}
            <Link
              href={`/student/decks/${deckId}/study?direction=en_to_ru`}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🇬🇧 → 🇷🇺</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Английский → Русский
                </h3>
                <p className="text-gray-700 mb-4">
                  Увидишь слово на английском, попробуй вспомнить перевод
                </p>
                <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold">
                  Начать учить →
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
