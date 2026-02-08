'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStudyCards, updateUserCard, ensureUserCardsExist } from '@/lib/srs/queries';
import { handleMarkKnow, handleMarkDontKnow } from '@/lib/srs/engine';
import type { UserCardWithCard } from '@/lib/srs/types';

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
    if (profile && deckId) {
      loadCards();
    }
  }, [profile, deckId]);

  async function loadCards() {
    if (!profile) return;
    try {
      await ensureUserCardsExist(supabase, profile.id, deckId);
      const data = await getStudyCards(supabase, profile.id, deckId);
      // Shuffle for variety
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setCards(shuffled);
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
      router.push(`/student/decks/${deckId}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка карточек...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек</h1>
          <p className="text-gray-700 mb-6">В этом наборе пока нет карточек</p>
          <Link
            href={`/student/decks/${deckId}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ← Назад к набору
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const cardData = currentCard.cards;

  // Front: RU word, Back: EN translation
  const frontText = cardData.ru_text;
  const backText = cardData.en_text;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href={`/student/decks/${deckId}`}
            className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium"
          >
            ← Выход
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
              {currentIndex + 1} из {cards.length}
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                ✓ {sessionStats.know}
              </span>
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                ✗ {sessionStats.dontKnow}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/50 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div
          className={`relative mb-8 ${!isFlipped ? 'cursor-pointer' : ''} transition-opacity duration-200`}
          style={{
            perspective: '1000px',
            height: '400px',
            opacity: isTransitioning ? 0 : 1,
          }}
          onClick={!isFlipped ? () => setIsFlipped(true) : undefined}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front: RU word */}
            <div
              className="absolute w-full h-full"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-12 h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">🇷🇺</div>
                  <p className="text-5xl font-bold text-gray-900 mb-3">
                    {frontText}
                  </p>
                  {cardData.ru_transcription && (
                    <p className="text-xl text-blue-600 mb-8 italic">
                      [{cardData.ru_transcription}]
                    </p>
                  )}
                  <p className="text-gray-600 text-lg mt-8">
                    👆 Нажми чтобы увидеть ответ
                  </p>
                </div>
              </div>
            </div>

            {/* Back: EN translation */}
            <div
              className="absolute w-full h-full"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-2xl p-12 h-full flex flex-col justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-6">🇬🇧</div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <p className="text-5xl font-bold">{backText}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(cards[currentIndex].cards.en_text, 'en');
                      }}
                      className="text-4xl hover:scale-110 transition-transform active:scale-95"
                      title="Прослушать"
                    >
                      🔊
                    </button>
                  </div>
                  <div className="mt-8 pt-6 border-t-2 border-white/30">
                    <p className="text-sm text-green-100 mb-2">Перевод:</p>
                    <p className="text-2xl text-white font-medium">
                      🇷🇺 {frontText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="py-6 bg-red-500 text-white rounded-xl font-bold text-xl hover:bg-red-600 transition shadow-lg active:scale-95"
            >
              ✗ Не знаю
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="py-6 bg-green-500 text-white rounded-xl font-bold text-xl hover:bg-green-600 transition shadow-lg active:scale-95"
            >
              ✓ Знаю
            </button>
          </div>
        )}

        {!isFlipped && (
          <div className="text-center text-gray-600">
            <p className="text-lg">Подумай над ответом, затем нажми на карточку</p>
          </div>
        )}
      </div>
    </div>
  );
}
