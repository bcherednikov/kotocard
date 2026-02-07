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
  created_at: string;
};

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  audio_url: string | null;
  tts_en_url: string | null;
  tts_ru_url: string | null;
  position: number;
  created_at: string;
};

type TtsStats = {
  total: number;
  with_tts: number;
  pending: number;
  percentage: number;
};

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [ttsStats, setTtsStats] = useState<TtsStats | null>(null);
  const [generatingTts, setGeneratingTts] = useState(false);

  const deckId = params.id as string;

  useEffect(() => {
    if (profile && deckId) {
      loadDeck();
      loadCards();
      loadTtsStats();
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

  async function loadCards() {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('position', { ascending: true });

      if (error) throw error;

      setCards(data || []);
    } catch (err) {
      console.error('Ошибка загрузки карточек:', err);
    }
  }

  async function loadTtsStats() {
    try {
      const res = await fetch(`/api/decks/${deckId}/generate-tts`);
      if (res.ok) {
        const data = await res.json();
        setTtsStats(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики TTS:', err);
    }
  }

  async function handleGenerateTts() {
    if (!confirm('Запустить генерацию аудио для всех карточек? Это может занять несколько минут.')) {
      return;
    }

    setGeneratingTts(true);

    try {
      const res = await fetch(`/api/decks/${deckId}/generate-tts`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Генерация запущена!');
        // Обновить статистику через несколько секунд
        setTimeout(() => {
          loadTtsStats();
          loadCards();
        }, 5000);
      } else {
        alert(data.error || 'Ошибка запуска генерации');
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка запуска генерации');
    } finally {
      setGeneratingTts(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Удалить эту карточку?')) return;

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      loadCards(); // Перезагрузить список
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  }

  async function handleDelete() {
    if (!confirm('Вы уверены? Это удалит набор и все карточки в нём!')) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      router.push('/admin/decks');
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления набора');
    } finally {
      setDeleting(false);
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
          href="/admin/decks"
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
            href="/admin/decks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>

        {/* Заголовок и действия */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {deck.name}
              </h1>
              {deck.description && (
                <p className="text-gray-700">{deck.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/decks/${deckId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Изменить
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>

          {deck.tags && deck.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {deck.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Создан: {new Date(deck.created_at).toLocaleDateString('ru-RU')}
          </div>
        </div>

        {/* Карточки */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Карточки ({cards.length})
              </h2>
              {ttsStats && ttsStats.total > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">
                    🔊 Аудио: {ttsStats.with_tts} из {ttsStats.total} ({ttsStats.percentage}%)
                  </span>
                  {ttsStats.pending > 0 && (
                    <button
                      onClick={handleGenerateTts}
                      disabled={generatingTts}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {generatingTts ? '⏳ Запуск...' : '🎤 Сгенерировать аудио'}
                    </button>
                  )}
                  {ttsStats.pending === 0 && (
                    <span className="text-green-600 font-medium">✅ Все аудио готовы</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/admin/decks/${deckId}/cards/bulk`}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition"
              >
                ✨ Массовое создание
              </Link>
              <Link
                href={`/admin/decks/${deckId}/cards/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                + Добавить карточку
              </Link>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-700 mb-6">
                В этом наборе пока нет карточек
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href={`/admin/decks/${deckId}/cards/bulk`}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition"
                >
                  ✨ Массовое создание
                </Link>
                <Link
                  href={`/admin/decks/${deckId}/cards/new`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Создать карточку
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-gray-600 font-medium">
                          #{index + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">🇷🇺 Русский:</p>
                            <p className="text-gray-900 font-medium">{card.ru_text}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">🇬🇧 Английский:</p>
                            <p className="text-gray-900 font-medium">{card.en_text}</p>
                          </div>
                        </div>
                      </div>
                      {card.audio_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>🔊</span>
                          <span>Есть аудио (legacy)</span>
                        </div>
                      )}
                      {(card.tts_en_url || card.tts_ru_url) && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <span>🎤</span>
                          <span>
                            TTS: {card.tts_en_url ? '🇬🇧' : ''} {card.tts_ru_url ? '🇷🇺' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/decks/${deckId}/cards/${card.id}/edit`}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
