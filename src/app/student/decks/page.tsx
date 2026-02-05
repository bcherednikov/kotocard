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

export default function StudentDecksPage() {
  const { profile, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDecks();
    }
  }, [profile]);

  async function loadDecks() {
    if (!profile) return;

    try {
      // Загрузить наборы семьи
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (decksError) throw decksError;

      // Для каждого набора получить количество карточек
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
    } catch (err) {
      console.error('Ошибка загрузки наборов:', err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Приветствие */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Привет, {profile?.display_name}!
          </h1>
          <p className="text-xl text-gray-700">
            Выбери набор карточек для изучения
          </p>
        </div>

        {/* Список наборов */}
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
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/student/decks/${deck.id}`}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-2xl transition transform hover:scale-105"
              >
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-3">
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p className="text-blue-100 text-sm mb-4 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">📝</span>
                      <span className="text-lg font-semibold">
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
  );
}
