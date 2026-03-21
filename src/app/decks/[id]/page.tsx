'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ensureUserCardsExist, getDeckSrsStats } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  owner_id: string;
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
  const { user, profile } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<DeckSrsStats | null>(null);
  const [ttsStats, setTtsStats] = useState<TtsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingTts, setGeneratingTts] = useState(false);

  const deckId = params.id as string;
  const isOwner = deck && user && deck.owner_id === user.id;

  useEffect(() => {
    if (user && profile && deckId) loadAll();
  }, [user, profile, deckId]);

  async function loadAll() {
    if (!user || !profile) return;
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;
      setDeck(data);

      // Load cards list (for owner management)
      const { data: cardsData } = await supabase
        .from('cards')
        .select('id, ru_text, en_text, audio_url, tts_en_url, tts_ru_url, position')
        .eq('deck_id', deckId)
        .order('position', { ascending: true });
      setCards(cardsData || []);

      // Ensure user_cards exist + load SRS stats
      await ensureUserCardsExist(supabase, user.id, deckId);
      const s = await getDeckSrsStats(supabase, user.id, deckId);
      setStats(s);

      // Load TTS stats
      try {
        const res = await fetch(`/api/decks/${deckId}/generate-tts`);
        if (res.ok) setTtsStats(await res.json());
      } catch {}
    } catch (err) {
      console.error('Error loading deck:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTts() {
    if (!confirm('Запустить генерацию аудио для всех карточек?')) return;
    setGeneratingTts(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/generate-tts`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Генерация запущена!');
        setTimeout(() => { loadAll(); }, 5000);
      } else {
        alert(data.error || 'Ошибка запуска генерации');
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка');
    } finally {
      setGeneratingTts(false);
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm('Удалить эту карточку?')) return;
    try {
      const { error } = await supabase.from('cards').delete().eq('id', cardId);
      if (error) throw error;
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  }

  async function handleDeleteDeck() {
    if (!confirm('Вы уверены? Это удалит набор и все карточки в нём!')) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('decks').delete().eq('id', deckId);
      if (error) throw error;
      router.push('/decks');
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
        <div className="text-6xl mb-4">&#10060;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Набор не найден</h1>
        <Link href="/decks" className="text-blue-600 hover:text-blue-800 font-medium">
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
        <div className="mb-6">
          <Link href="/decks" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Назад к наборам
          </Link>
        </div>

        {/* Deck header with SRS progress */}
        <div className="bg-blue-500 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{deck.name}</h1>
              {deck.description && (
                <p className="text-blue-100 mb-4">{deck.description}</p>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/decks/${deckId}/edit`}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition"
                >
                  Изменить
                </Link>
                <button
                  onClick={handleDeleteDeck}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500/80 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleting ? '...' : 'Удалить'}
                </button>
              </div>
            )}
          </div>
          {deck.tags && deck.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {deck.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {stats && (
            <div className="flex justify-center">
              <DeckSrsProgress stats={stats} variant="onDark" />
            </div>
          )}
        </div>

        {/* Study modes */}
        {stats !== null && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link
              href={`/decks/${deckId}/study`}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center"
            >
              <div className="text-4xl mb-2">📖</div>
              <h3 className="font-bold text-gray-900 mb-1">Изучение</h3>
              <span className="text-sm text-blue-600">{studyCount} карт.</span>
            </Link>

            <Link
              href={`/decks/${deckId}/test`}
              className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center ${testCount === 0 ? 'opacity-60' : ''}`}
            >
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-bold text-gray-900 mb-1">Тест</h3>
              <span className={`text-sm ${testCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                {testCount > 0 ? `${testCount} готово` : 'Нет'}
              </span>
            </Link>

            <Link
              href={`/decks/${deckId}/review`}
              className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center ${reviewCount === 0 ? 'opacity-60' : ''}`}
            >
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="font-bold text-gray-900 mb-1">Повторение</h3>
              <span className={`text-sm ${reviewCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {reviewCount > 0 ? `${reviewCount} изучено` : 'Нет'}
              </span>
            </Link>

            <Link
              href={`/decks/${deckId}/dictation`}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center"
            >
              <div className="text-4xl mb-2">✏️</div>
              <h3 className="font-bold text-gray-900 mb-1">Диктант</h3>
              <span className="text-sm text-indigo-600">{studyCount} слов</span>
            </Link>
          </div>
        )}

        {/* Cards management (owner only) */}
        {isOwner && (
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
                    {ttsStats.pending > 0 ? (
                      <button
                        onClick={handleGenerateTts}
                        disabled={generatingTts}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {generatingTts ? '⏳ Запуск...' : '🎤 Сгенерировать аудио'}
                      </button>
                    ) : (
                      <>
                        <span className="text-green-600 font-medium">✅ Все аудио готовы</span>
                        <button
                          onClick={handleGenerateTts}
                          disabled={generatingTts}
                          className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
                        >
                          {generatingTts ? '⏳ Запуск...' : '🔄 Регенерировать'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/decks/${deckId}/cards/bulk`}
                  className="px-4 py-2 bg-purple-500 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition"
                >
                  ✨ Массовое создание
                </Link>
                <Link
                  href={`/decks/${deckId}/cards/new`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  + Добавить
                </Link>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-700 mb-6">В этом наборе пока нет карточек</p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href={`/decks/${deckId}/cards/bulk`}
                    className="px-6 py-3 bg-purple-500 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition"
                  >
                    ✨ Массовое создание
                  </Link>
                  <Link
                    href={`/decks/${deckId}/cards/new`}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
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
                          <span className="text-sm text-gray-600 font-medium">#{index + 1}</span>
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
                        {(card.tts_en_url || card.tts_ru_url) && (
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <span>🎤</span>
                            <span>TTS: {card.tts_en_url ? '🇬🇧' : ''} {card.tts_ru_url ? '🇷🇺' : ''}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/decks/${deckId}/cards/${card.id}/edit`}
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
        )}

        {/* Non-owner: show empty cards message if no cards */}
        {!isOwner && stats !== null && stats.total === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">В этом наборе пока нет карточек</h2>
          </div>
        )}
      </div>
    </div>
  );
}
