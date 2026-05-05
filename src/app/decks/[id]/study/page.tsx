'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useStudyData } from '@/hooks/useDeckData';
import { updateUserCard } from '@/lib/srs/queries';
import { handleMarkKnow, handleMarkDontKnow } from '@/lib/srs/engine';
import type { UserCardWithCard } from '@/lib/srs/types';
import { trackActivityInBackground } from '@/lib/analytics/tracker';
import { ImmersiveShell } from '@/components/layout/ImmersiveShell';
import { Badge } from '@/components/ui/badge';

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const deckId = params.id as string;
  const { data: studyData, isLoading } = useStudyData(deckId);

  const [cards, setCards] = useState<UserCardWithCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionStats, setSessionStats] = useState({ know: 0, dontKnow: 0 });
  const [sessionStarted, setSessionStarted] = useState(false);

  // Populate local state from SWR data once loaded
  useEffect(() => {
    if (!studyData?.userCards || sessionStarted) return;
    const loaded = studyData.userCards as UserCardWithCard[];
    setCards(loaded);
    setSessionStarted(true);
    if (loaded.length > 0 && profile) {
      trackActivityInBackground(supabase, profile.id, { study_sessions: 1 });
    }
  }, [studyData, sessionStarted, profile]);

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

  const progress = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  const leftBadge = cards.length > 0 ? (
    <Badge variant="green">✓ {sessionStats.know}</Badge>
  ) : undefined;

  const rightBadge = cards.length > 0 ? (
    <Badge variant="red">✗ {sessionStats.dontKnow}</Badge>
  ) : undefined;

  if (isLoading || !sessionStarted) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Изучение">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">Загрузка карточек...</p>
        </div>
      </ImmersiveShell>
    );
  }

  if (cards.length === 0) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Изучение">
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Нет карточек</h1>
            <p className="text-gray-500 text-sm">В этом наборе пока нет карточек</p>
          </div>
        </div>
      </ImmersiveShell>
    );
  }

  const currentCard = cards[currentIndex];
  const cardData = currentCard.cards;
  const frontText = cardData.ru_text;
  const backText = cardData.en_text;

  return (
    <ImmersiveShell
      backHref={`/decks/${deckId}`}
      title={`${currentIndex + 1} / ${cards.length}`}
      progress={progress}
      leftBadge={leftBadge}
      rightBadge={rightBadge}
    >
      <div className="py-6 px-4 max-w-2xl mx-auto">
        {/* Flashcard */}
        <div
          className={`relative mb-6 ${!isFlipped ? 'cursor-pointer' : ''} transition-opacity duration-200`}
          style={{ perspective: '1000px', height: '340px', opacity: isTransitioning ? 0 : 1 }}
          onClick={!isFlipped ? () => setIsFlipped(true) : undefined}
        >
          <div className="relative w-full h-full transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

            {/* Front */}
            <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-5">🇷🇺</div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{frontText}</p>
                  {cardData.ru_transcription && (
                    <p className="text-lg text-[#057A55] mb-4 italic">[{cardData.ru_transcription}]</p>
                  )}
                  <p className="text-gray-400 text-sm mt-6">Нажми чтобы увидеть ответ</p>
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="rounded-2xl shadow-sm p-10 h-full flex flex-col justify-center"
                style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}>
                <div className="text-center text-white">
                  <div className="text-5xl mb-5">🇬🇧</div>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <p className="text-4xl font-bold">{backText}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); speakText(cards[currentIndex].cards.en_text, 'en'); }}
                      className="text-3xl hover:scale-110 transition-transform active:scale-95 opacity-70 hover:opacity-100"
                      title="Прослушать"
                    >
                      🔊
                    </button>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/20">
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
    </ImmersiveShell>
  );
}
