'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ensureUserCardsExist, getDeckSrsStats } from '@/lib/srs/queries';
import { fetchUnsplashUrl } from '@/lib/unsplash';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import { Button } from '@/components/ui/button';
import { Card as UiCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  image_url: string | null;
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
  const [fetchingImages, setFetchingImages] = useState(false);

  const deckId = params.id as string;
  const isOwner = deck && user && deck.owner_id === user.id;

  useEffect(() => {
    if (user && profile && deckId) loadAll();
  }, [user, profile, deckId]);

  async function loadAll() {
    if (!user || !profile) return;
    try {
      // deck + cards in parallel
      const [deckResult, cardsResult] = await Promise.all([
        supabase.from('decks').select('*').eq('id', deckId).single(),
        supabase.from('cards')
          .select('id, ru_text, en_text, audio_url, tts_en_url, tts_ru_url, image_url, position')
          .eq('deck_id', deckId)
          .order('position', { ascending: true }),
      ]);

      if (deckResult.error) throw deckResult.error;
      setDeck(deckResult.data);
      const loadedCards = cardsResult.data || [];
      setCards(loadedCards);

      // ensureUserCards (reuse already-loaded IDs) + SRS stats in parallel
      const cardIds = loadedCards.map((c) => c.id);
      const [, s] = await Promise.all([
        ensureUserCardsExist(supabase, user.id, deckId, cardIds),
        getDeckSrsStats(supabase, user.id, deckId),
      ]);
      setStats(s);

      // TTS stats are non-critical — load in background
      fetch(`/api/decks/${deckId}/generate-tts`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) setTtsStats(data); })
        .catch(() => {});
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

  async function handleFetchAllImages() {
    const missing = cards.filter(c => !c.image_url);
    if (missing.length === 0) return;
    setFetchingImages(true);
    for (const card of missing) {
      const imageUrl = await fetchUnsplashUrl(card.en_text);
      if (imageUrl) {
        await supabase.from('cards').update({ image_url: imageUrl }).eq('id', card.id);
        setCards(prev => prev.map(c => c.id === card.id ? { ...c, image_url: imageUrl } : c));
      }
    }
    setFetchingImages(false);
  }

  async function handleRefreshImage(card: Card) {
    const page = Math.floor(Math.random() * 20) + 1;
    const imageUrl = await fetchUnsplashUrl(card.en_text, page);
    if (!imageUrl) return;
    await supabase.from('cards').update({ image_url: imageUrl }).eq('id', card.id);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, image_url: imageUrl } : c));
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <UiCard className="w-full max-w-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Загрузка...</CardContent>
        </UiCard>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F5F0' }}>
        <UiCard className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Набор не найден</CardTitle>
            <CardDescription>Проверьте ссылку или вернитесь к списку наборов.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/decks" />}>Вернуться к наборам</Button>
          </CardContent>
        </UiCard>
      </div>
    );
  }

  const studyCount = stats?.total ?? 0;
  const testCount = stats?.readyForTesting ?? 0;
  const reviewCount = stats ? (stats.total - stats.newCount) : 0;

  return (
    <div className="max-w-3xl mx-auto md:mx-0">
      <div>

        {/* Back link */}
        <div className="mb-5">
          <Button variant="link" render={<Link href="/decks" />}>Назад к наборам</Button>
        </div>

        {/* Deck header */}
        <UiCard className="mb-6">
          <CardContent className="p-6 md:p-8">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{deck.name}</h1>
              {deck.description && (
                <p className="text-gray-500 text-sm mb-4">{deck.description}</p>
              )}
              {deck.tags && deck.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {deck.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" render={<Link href={`/decks/${deckId}/edit`} />}>Изменить</Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDeck}
                  disabled={deleting}
                >
                  {deleting ? '...' : 'Удалить'}
                </Button>
              </div>
            )}
          </div>
          {stats && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <DeckSrsProgress stats={stats} variant="default" />
            </div>
          )}
          </CardContent>
        </UiCard>

        {/* Study modes */}
        {stats !== null && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <UiCard className="p-0">
              <CardContent className="p-0">
                <Link href={`/decks/${deckId}/study`} className="block p-5">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3 text-lg">📖</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Изучение</h3>
              <Badge variant="secondary">{studyCount} карт.</Badge>
                </Link>
              </CardContent>
            </UiCard>

            <UiCard className={`p-0 ${testCount === 0 ? 'opacity-60' : ''}`}>
              <CardContent className="p-0">
                <Link href={`/decks/${deckId}/test`} className="block p-5">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 text-lg">🎯</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Тест</h3>
              <Badge variant={testCount > 0 ? 'secondary' : 'outline'}>{testCount > 0 ? `${testCount} готово` : 'Нет'}</Badge>
                </Link>
              </CardContent>
            </UiCard>

            <UiCard className={`p-0 ${reviewCount === 0 ? 'opacity-60' : ''}`}>
              <CardContent className="p-0">
                <Link href={`/decks/${deckId}/review`} className="block p-5">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-3 text-lg">🔄</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Повторение</h3>
              <Badge variant={reviewCount > 0 ? 'secondary' : 'outline'}>{reviewCount > 0 ? `${reviewCount} изучено` : 'Нет'}</Badge>
                </Link>
              </CardContent>
            </UiCard>

            <UiCard className="p-0">
              <CardContent className="p-0">
                <Link href={`/decks/${deckId}/dictation`} className="block p-5">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center mb-3 text-lg">✏️</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-0.5">Диктант</h3>
              <Badge variant="secondary">{studyCount} слов</Badge>
                </Link>
              </CardContent>
            </UiCard>
          </div>
        )}

        {/* Cards management (owner only) */}
        {isOwner && (
          <UiCard>
            <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Карточки <span className="text-gray-400 font-normal text-base">({cards.length})</span>
                </h2>
                {ttsStats && ttsStats.total > 0 && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>Аудио: {ttsStats.with_tts} / {ttsStats.total} ({ttsStats.percentage}%)</span>
                    {ttsStats.pending > 0 ? (
                      <Button
                        size="sm"
                        onClick={handleGenerateTts}
                        disabled={generatingTts}
                      >
                        {generatingTts ? 'Запуск...' : 'Сгенерировать аудио'}
                      </Button>
                    ) : (
                      <>
                        <span className="text-[#057A55] font-medium">Все аудио готовы</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleGenerateTts}
                          disabled={generatingTts}
                        >
                          {generatingTts ? 'Запуск...' : 'Регенерировать'}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap shrink-0">
                {cards.some(c => !c.image_url) && (
                  <Button
                    variant="outline"
                    onClick={handleFetchAllImages}
                    disabled={fetchingImages}
                  >
                    {fetchingImages ? 'Загружаю...' : 'Загрузить картинки'}
                  </Button>
                )}
                <Button variant="outline" render={<Link href={`/decks/${deckId}/cards/bulk`} />}>Массово</Button>
                <Button render={<Link href={`/decks/${deckId}/cards/new`} />}>+ Добавить</Button>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📝</div>
                <p className="text-gray-500 text-sm mb-5">В этом наборе пока нет карточек</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" render={<Link href={`/decks/${deckId}/cards/bulk`} />}>Массово добавить</Button>
                  <Button render={<Link href={`/decks/${deckId}/cards/new`} />}>Создать карточку</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:bg-gray-50/50 transition"
                  >
                    <div className="flex justify-between items-start gap-3">
                      {/* Image thumbnail */}
                      <div className="shrink-0">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.en_text}
                            className="w-14 h-14 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center leading-tight">
                            нет фото
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshImage(card)}
                          title="Найти другое изображение"
                        >
                          обновить
                        </Button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Русский</p>
                            <p className="text-gray-900 font-medium text-sm">{card.ru_text}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Английский</p>
                            <p className="text-gray-900 font-medium text-sm">{card.en_text}</p>
                          </div>
                        </div>
                        {(card.tts_en_url || card.tts_ru_url) && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#057A55]">
                            <span>Аудио:</span>
                            <span>{card.tts_en_url ? 'EN' : ''} {card.tts_ru_url ? 'RU' : ''}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/decks/${deckId}/cards/${card.id}/edit`} />}
                        >
                          Изменить
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </UiCard>
        )}

        {/* Non-owner: show empty cards message if no cards */}
        {!isOwner && stats !== null && stats.total === 0 && (
          <UiCard className="p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📝</div>
            <h2 className="text-lg font-bold text-gray-900">В этом наборе пока нет карточек</h2>
          </UiCard>
        )}
      </div>
    </div>
  );
}
