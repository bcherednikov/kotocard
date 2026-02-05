'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  created_at: string;
  _count?: { cards: number };
};

export default function AdminDecksPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const hasTimedOut = useLoadingTimeout(authLoading || loading, 10000);

  useEffect(() => {
    if (profile) {
      // Проверить, что это админ
      if (profile.role !== 'admin') {
        router.push('/student/decks');
        return;
      }
      loadDecks();
    } else if (!authLoading) {
      // Если нет профиля и загрузка auth завершена - редирект на логин
      router.push('/login');
    }
  }, [profile, authLoading, router]);

  async function loadDecks() {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('decks')
        .select(`
          id,
          name,
          description,
          tags,
          created_at
        `)
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDecks(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Ошибка загрузки наборов:', err);
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  if (hasTimedOut) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Превышено время загрузки
          </h2>
          <p className="text-gray-700 mb-6">
            Страница загружается слишком долго. Попробуйте обновить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
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
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Наборы карточек
            </h1>
            <p className="text-gray-700 mt-1">
              Управляйте наборами для вашей семьи
            </p>
          </div>
          <Link
            href="/admin/decks/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Создать набор
          </Link>
        </div>

        {/* Список наборов */}
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
              href="/admin/decks/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Создать первый набор
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/admin/decks/${deck.id}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {deck.name}
                </h3>
                {deck.description && (
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {deck.description}
                  </p>
                )}
                {deck.tags && deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
