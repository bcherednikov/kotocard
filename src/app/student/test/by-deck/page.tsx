'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  studiedCardsCount: number;
  totalCardsCount: number;
};

export default function SelectDeckForTestPage() {
  const router = useRouter();
  const { profile } = useAuth();
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
      // Загрузить все наборы семьи
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (decksError) throw decksError;

      // Для каждого набора получить количество карточек и изученных карточек
      const decksWithStats = await Promise.all(
        (decksData || []).map(async (deck) => {
          // Всего карточек
          const { count: totalCount } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

          // Изученных карточек (есть прогресс у этого пользователя)
          const { count: studiedCount } = await supabase
            .from('card_progress')
            .select('card_id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .in('card_id', 
              supabase
                .from('cards')
                .select('id')
                .eq('deck_id', deck.id)
            );

          return {
            ...deck,
            totalCardsCount: totalCount || 0,
            studiedCardsCount: studiedCount || 0
          };
        })
      );

      // Фильтруем наборы - показываем только те, где есть изученные карточки
      const availableDecks = decksWithStats.filter(d => d.studiedCardsCount > 0);
      setDecks(availableDecks);
    } catch (err) {
      console.error('Ошибка загрузки наборов:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка наборов...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <Link
            href="/student/test"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Назад к выбору режима
          </Link>
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Выбери тему для проверки
            </h1>
            <p className="text-xl text-gray-700">
              Тест будет составлен только из карточек выбранного набора
            </p>
          </div>
        </div>

        {/* Список наборов */}
        {decks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Нет доступных наборов для теста
            </h2>
            <p className="text-gray-700 mb-6">
              Сначала нужно изучить карточки хотя бы из одного набора
            </p>
            <Link
              href="/student/decks"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Перейти к наборам
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/student/test/by-deck/${deck.id}`}
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 flex-1">
                    {deck.name}
                  </h3>
                  <div className="text-3xl text-gray-400">→</div>
                </div>
                
                {deck.description && (
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {deck.description}
                  </p>
                )}

                {/* Статистика */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <span className="text-xl">📝</span>
                    <div>
                      <div className="text-xs text-gray-600">Изучено</div>
                      <div className="font-bold text-blue-800">
                        {deck.studiedCardsCount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-xl">📚</span>
                    <div>
                      <div className="text-xs text-gray-600">Всего</div>
                      <div className="font-bold text-gray-800">
                        {deck.totalCardsCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Тэги */}
                {deck.tags && deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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

                {/* Прогресс бар */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Прогресс изучения</span>
                    <span>{Math.round((deck.studiedCardsCount / deck.totalCardsCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all"
                      style={{ width: `${(deck.studiedCardsCount / deck.totalCardsCount) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Подсказка */}
        {decks.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Подсказка:</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>✅ В тесте будут только те карточки, которые ты уже изучал</li>
              <li>🎲 Тест состоит из 10 случайных вопросов из выбранного набора</li>
              <li>📊 Разные типы заданий: текст, аудио, диктант, выбор варианта</li>
              <li>🏆 Можешь пройти тест несколько раз для лучшего результата</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
