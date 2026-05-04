'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ensureUserCardsExist, getDeckSrsStats } from '@/lib/srs/queries';
import { DeckSrsProgress } from '@/components/student/DeckSrsProgress';
import type { DeckSrsStats } from '@/lib/srs/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

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
        <Link href="/decks" className="text-[#057A55] hover:underline font-medium">
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
        <PageHeader
          title={deck.name}
          back="/decks"
          actions={
            isOwner ? (
              <div className="flex items-center gap-2">
                <Link href={`/decks/${deckId}/edit`}>
                  <Button variant="secondary" size="sm">Изменить</Button>
                </Link>
                <Button variant="danger" size="sm" onClick={handleDeleteDeck} loading={deleting}>
                  {deleting ? '...' : 'Удалить'}
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* Deck info card */}
        <Card className="mb-8">
          <CardContent>
            <h1 data-testid="deck-title" className="text-2xl font-bold text-gray-900 mb-2">{deck.name}</h1>
            {deck.description && (
              <p className="text-gray-500 mb-4">{deck.description}</p>
            )}
            {deck.tags && deck.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {deck.tags.map((tag, idx) => (
                  <Badge key={idx} variant="gray">{tag}</Badge>
                ))}
              </div>
            )}
            {stats && (
              <div className="flex justify-center">
                <DeckSrsProgress stats={stats} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study modes */}
        {stats !== null && stats.total > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Link href={`/decks/${deckId}/study`}>
              <Card variant="interactive" className="p-6 text-center">
                <div className="text-4xl mb-2">📖</div>
                <h3 className="font-bold text-gray-900 mb-1">Изучение</h3>
                <span className="text-sm text-[#057A55]">{studyCount} карт.</span>
              </Card>
            </Link>

            <Link href={`/decks/${deckId}/test`}>
              <Card variant="interactive" className={`p-6 text-center ${testCount === 0 ? 'opacity-60' : ''}`}>
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="font-bold text-gray-900 mb-1">Тест</h3>
                <span className={`text-sm ${testCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {testCount > 0 ? `${testCount} готово` : 'Нет'}
                </span>
              </Card>
            </Link>

            <Link href={`/decks/${deckId}/dictation`}>
              <Card variant="interactive" className="p-6 text-center">
                <div className="text-4xl mb-2">✏️</div>
                <h3 className="font-bold text-gray-900 mb-1">Диктант</h3>
                <span className="text-sm text-indigo-600">{studyCount} слов</span>
              </Card>
            </Link>
          </div>
        )}

        {/* Cards management (owner only) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle>Карточки ({cards.length})</CardTitle>
                  {ttsStats && ttsStats.total > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                      <span className="text-gray-500">
                        🔊 Аудио: {ttsStats.with_tts} из {ttsStats.total} ({ttsStats.percentage}%)
                      </span>
                      {ttsStats.pending > 0 ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleGenerateTts}
                          loading={generatingTts}
                        >
                          🎤 Сгенерировать аудио
                        </Button>
                      ) : (
                        <>
                          <span className="text-[#057A55] font-medium">✅ Все аудио готовы</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateTts}
                            loading={generatingTts}
                          >
                            🔄 Регенерировать
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/decks/${deckId}/cards/bulk`}>
                    <Button variant="secondary" size="sm">✨ Массовое создание</Button>
                  </Link>
                  <Link href={`/decks/${deckId}/cards/new`}>
                    <Button variant="primary" size="sm">+ Добавить</Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500 mb-6">В этом наборе пока нет карточек</p>
                  <div className="flex gap-3 justify-center">
                    <Link href={`/decks/${deckId}/cards/bulk`}>
                      <Button variant="secondary">✨ Массовое создание</Button>
                    </Link>
                    <Link href={`/decks/${deckId}/cards/new`}>
                      <Button variant="primary">Создать карточку</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card, index) => (
                    <div
                      key={card.id}
                      className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-400 font-medium shrink-0">#{index + 1}</span>
                            <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">🇷🇺 Русский:</p>
                                <p className="text-sm text-gray-900 font-medium truncate">{card.ru_text}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">🇬🇧 Английский:</p>
                                <p className="text-sm text-gray-900 font-medium truncate">{card.en_text}</p>
                              </div>
                            </div>
                          </div>
                          {(card.tts_en_url || card.tts_ru_url) && (
                            <div className="flex items-center gap-2 text-xs text-[#057A55]">
                              <span>🎤</span>
                              <span>TTS: {card.tts_en_url ? '🇬🇧' : ''} {card.tts_ru_url ? '🇷🇺' : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Link href={`/decks/${deckId}/cards/${card.id}/edit`}>
                            <Button variant="ghost" size="sm">Изменить</Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
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
          </Card>
        )}

        {/* Non-owner: show empty cards message if no cards */}
        {!isOwner && stats !== null && stats.total === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">В этом наборе пока нет карточек</h2>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
