'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateUserCard } from '@/lib/srs/queries';
import { handleMarkKnow, handleMarkDontKnow } from '@/lib/srs/engine';
import type { UserCardWithCard } from '@/lib/srs/types';
import { trackActivityInBackground } from '@/lib/analytics/tracker';

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const deckId = params.id as string;

  const [cards, setCards] = useState<UserCardWithCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ know: 0, dontKnow: 0 });

  useEffect(() => {
    if (profile && deckId) loadCards();
  }, [profile, deckId]);

  async function loadCards() {
    if (!profile) return;
    try {
      // Fetch card IDs and existing user_cards in parallel to avoid sequential round-trips
      const [cardIdsRes, userCardsRes] = await Promise.all([
        supabase.from('cards').select('id').eq('deck_id', deckId),
        supabase.from('user_cards').select('*, cards(*)')
          .eq('user_id', profile.id).eq('deck_id', deckId)
          .order('created_at', { ascending: true }),
      ]);

      const allCardIds = (cardIdsRes.data ?? []).map((c) => c.id);
      let userCards = (userCardsRes.data ?? []) as UserCardWithCard[];

      // Insert missing user_cards if needed (first visit to this deck)
      const existingIds = new Set(userCards.map((uc) => uc.card_id));
      const missingIds = allCardIds.filter((id) => !existingIds.has(id));
      if (missingIds.length > 0) {
        await supabase.from('user_cards').insert(
          missingIds.map((id) => ({ card_id: id, user_id: profile.id, deck_id: deckId, status: 'new' as const }))
        );
        const { data: refreshed } = await supabase
          .from('user_cards').select('*, cards(*)')
          .eq('user_id', profile.id).eq('deck_id', deckId)
          .order('created_at', { ascending: true });
        userCards = (refreshed ?? []) as UserCardWithCard[];
      }

      const shuffled = [...userCards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      if (shuffled.length > 0) {
        trackActivityInBackground(supabase, profile.id, { study_sessions: 1 });
      }
    } catch (err) {
      console.error('Error loading study cards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(isKnow: boolean) {
    if (!user || !cards[currentIndex]) return;

    const card = cards[currentIndex];
    const updates = isKnow ? handleMarkKnow(card) : handleMarkDontKnow(card);

    try {
      await updateUserCard(supabase, card.user_card_id, updates);
      trackActivityInBackground(supabase, user.id, { words_studied: 1 });
    } catch (err) {
      console.error('Error saving progress:', err);
    }

    setSessionStats({
      know: isKnow ? sessionStats.know + 1 : sessionStats.know,
      dontKnow: !isKnow ? sessionStats.dontKnow + 1 : sessionStats.dontKnow,
    });

    if (currentIndex < cards.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 150);
    } else {
      router.push(`/decks/${deckId}`);
    }
  }

  async function speakText(text: string, lang: 'en' | 'ru') {
    try {
      const { playTts } = await import('@/lib/tts');
      await playTts(text, lang);
    } catch (e) {
      console.error('TTS:', e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка карточек...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F5F0' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Нет карточек</h1>
          <p className="text-gray-500 text-sm mb-6">В этом наборе пока нет карточек</p>
          <Link href={`/decks/${deckId}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#057A55] text-white rounded-xl text-sm font-semibold hover:bg-[#065f46] transition">
            ← Назад к набору
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const cardData = currentCard.cards;
  const frontText = cardData.ru_text;
  const backText = cardData.en_text;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#F7F5F0' }}>
      <div className="max-w-2xl mx-auto">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-5">
          <Link href={`/decks/${deckId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Выход
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{currentIndex + 1} / {cards.length}</span>
            <div className="flex gap-1.5">
              <span className="px-2.5 py-1 bg-[#057A55]/10 text-[#057A55] rounded-full text-xs font-semibold">✓ {sessionStats.know}</span>
              <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold">✗ {sessionStats.dontKnow}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white rounded-full mb-7 overflow-hidden shadow-sm border border-gray-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%`, background: '#057A55' }}
          />
        </div>

        {/* Flashcard */}
        <div
          className={`relative mb-6 ${!isFlipped ? 'cursor-pointer' : ''} transition-opacity duration-200`}
          style={{ perspective: '1000px', height: '380px', opacity: isTransitioning ? 0 : 1 }}
          onClick={!isFlipped ? () => setIsFlipped(true) : undefined}
        >
          <div className="relative w-full h-full transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

            {/* Front */}
            <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-5">🇷🇺</div>
                  <p className="text-5xl font-bold text-gray-900 mb-2">{frontText}</p>
                  {cardData.ru_transcription && (
                    <p className="text-lg text-[#057A55] mb-6 italic">[{cardData.ru_transcription}]</p>
                  )}
                  <p className="text-gray-400 text-sm mt-7">Нажми чтобы увидеть ответ</p>
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="rounded-2xl shadow-sm p-12 h-full flex flex-col justify-center"
                style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}>
                <div className="text-center text-white">
                  <div className="text-5xl mb-5">🇬🇧</div>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <p className="text-5xl font-bold">{backText}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); speakText(cards[currentIndex].cards.en_text, 'en'); }}
                      className="text-3xl hover:scale-110 transition-transform active:scale-95 opacity-70 hover:opacity-100"
                      title="Прослушать"
                    >
                      🔊
                    </button>
                  </div>
                  <div className="mt-7 pt-5 border-t border-white/20">
                    <p className="text-xs text-white/50 mb-1.5 uppercase tracking-wide">Перевод</p>
                    <p className="text-xl text-white/80 font-medium">🇷🇺 {frontText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(false)}
              className="py-4 bg-white border border-red-200 text-red-500 rounded-2xl font-semibold text-base hover:bg-red-50 transition shadow-sm active:scale-98"
            >
              ✗ Не знаю
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="py-4 text-white rounded-2xl font-semibold text-base transition shadow-sm active:scale-98"
              style={{ background: '#057A55' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#065f46')}
              onMouseLeave={e => (e.currentTarget.style.background = '#057A55')}
            >
              ✓ Знаю
            </button>
          </div>
        )}

        {!isFlipped && (
          <div className="text-center text-gray-400 text-sm">
            Подумай над ответом, затем нажми на карточку
          </div>
        )}
      </div>
    </div>
  );
}
