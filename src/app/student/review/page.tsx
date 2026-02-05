'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  ru_transcription: string | null;
  deck_id: string;
};

type Direction = 'ru_to_en' | 'en_to_ru';

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const direction = (searchParams.get('direction') || 'ru_to_en') as Direction;

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0
  });
  const [answers, setAnswers] = useState<Array<{ cardId: string; isCorrect: boolean }>>([]);

  useEffect(() => {
    if (user && profile) {
      loadReviewCards();
    }
  }, [user, profile]);

  async function loadReviewCards() {
    try {
      // 1. Загрузить все изученные карточки (где есть прогресс)
      const { data: progress, error: progressError } = await supabase
        .from('card_progress')
        .select('card_id')
        .eq('user_id', user!.id)
        .gt('times_shown', 0);

      if (progressError) throw progressError;

      if (!progress || progress.length === 0) {
        alert('У тебя пока нет изученных карточек! Начни с раздела "Мои наборы".');
        router.push('/student/decks');
        return;
      }

      const cardIds = progress.map(p => p.card_id);

      // 2. Загрузить карточки
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('id', cardIds);

      if (cardsError) throw cardsError;

      // 3. Перемешать и взять 50 (или меньше если нет 50)
      const shuffled = (allCards || []).sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(50, shuffled.length));

      setCards(selected);
    } catch (err) {
      console.error('Ошибка загрузки карточек для повторения:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(isCorrect: boolean) {
    if (!user || !cards[currentIndex]) return;

    const card = cards[currentIndex];

    setAnswers(prev => [...prev, { cardId: card.id, isCorrect }]);

    const newStats = {
      correct: isCorrect ? sessionStats.correct + 1 : sessionStats.correct,
      incorrect: !isCorrect ? sessionStats.incorrect + 1 : sessionStats.incorrect
    };
    setSessionStats(newStats);

    // Переход к следующей карточке
    if (currentIndex < cards.length - 1) {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    } else {
      // Сохранить прогресс
      await saveAllProgress([...answers, { cardId: card.id, isCorrect }]);
      
      // Редирект на результаты
      router.push(`/student/review/complete?correct=${newStats.correct}&incorrect=${newStats.incorrect}&total=${cards.length}`);
    }
  }

  async function saveAllProgress(allAnswers: Array<{ cardId: string; isCorrect: boolean }>) {
    if (!user) return;

    try {
      for (const answer of allAnswers) {
        const { data: existing } = await supabase
          .from('card_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('card_id', answer.cardId)
          .eq('direction', direction)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('card_progress')
            .update({
              times_shown: existing.times_shown + 1,
              times_correct: answer.isCorrect ? existing.times_correct + 1 : existing.times_correct,
              times_incorrect: !answer.isCorrect ? existing.times_incorrect + 1 : existing.times_incorrect,
              last_reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('card_progress')
            .insert({
              user_id: user.id,
              card_id: answer.cardId,
              direction,
              times_shown: 1,
              times_correct: answer.isCorrect ? 1 : 0,
              times_incorrect: !answer.isCorrect ? 1 : 0,
              last_reviewed_at: new Date().toISOString()
            });
        }
      }
    } catch (err) {
      console.error('Ошибка сохранения прогресса:', err);
    }
  }

  function handleFlip() {
    setIsFlipped(!isFlipped);
  }

  function speakText(text: string, lang: 'en' | 'ru') {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Подбираем карточки для повторения...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек для повторения</h1>
          <p className="text-gray-700 mb-6">
            Сначала поучи карточки в разделе "Мои наборы"
          </p>
          <Link
            href="/student/decks"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Перейти к обучению
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const frontText = direction === 'ru_to_en' ? currentCard.ru_text : currentCard.en_text;
  const backText = direction === 'ru_to_en' ? currentCard.en_text : currentCard.ru_text;
  const frontFlag = direction === 'ru_to_en' ? '🇷🇺' : '🇬🇧';
  const backFlag = direction === 'ru_to_en' ? '🇬🇧' : '🇷🇺';
  
  const showTranscriptionOnFront = profile?.show_russian_transcription && 
                                   direction === 'en_to_ru' && 
                                   currentCard.ru_transcription;
  
  const showTranscriptionOnBack = profile?.show_russian_transcription && 
                                  direction === 'ru_to_en' && 
                                  currentCard.ru_transcription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔄</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Режим повторения</h1>
                <p className="text-sm text-gray-600">Карточки из всех изученных наборов</p>
              </div>
            </div>
            <Link
              href="/student/decks"
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Выход
            </Link>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-semibold text-gray-800">
            Карточка {currentIndex + 1} из {cards.length}
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
              ✓ {sessionStats.correct}
            </span>
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
              ✗ {sessionStats.incorrect}
            </span>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full h-2 bg-white/50 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Карточка */}
        <div 
          className={`relative mb-8 ${!isFlipped ? 'cursor-pointer' : ''} transition-opacity duration-200`}
          style={{ 
            perspective: '1000px', 
            height: '400px',
            opacity: isTransitioning ? 0 : 1
          }}
          onClick={!isFlipped ? handleFlip : undefined}
        >
          <div 
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Передняя сторона */}
            <div 
              className="absolute w-full h-full backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-12 h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">{frontFlag}</div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <p className="text-5xl font-bold text-gray-900">
                      {frontText}
                    </p>
                    {direction === 'en_to_ru' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(frontText, 'en');
                        }}
                        className="text-4xl hover:scale-110 transition-transform active:scale-95"
                        title="Прослушать"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {showTranscriptionOnFront && (
                    <p className="text-xl text-blue-600 mb-8 italic">
                      [{currentCard.ru_transcription}]
                    </p>
                  )}
                  <p className="text-gray-600 text-lg mt-8">
                    👆 Нажми чтобы увидеть ответ
                  </p>
                </div>
              </div>
            </div>

            {/* Задняя сторона */}
            <div 
              className="absolute w-full h-full backface-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-2xl p-12 h-full flex flex-col justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-6">{backFlag}</div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <p className="text-5xl font-bold">
                      {backText}
                    </p>
                    {direction === 'ru_to_en' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(backText, 'en');
                        }}
                        className="text-4xl hover:scale-110 transition-transform active:scale-95"
                        title="Прослушать"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {showTranscriptionOnBack && (
                    <p className="text-xl text-yellow-200 mb-8 italic">
                      [{currentCard.ru_transcription}]
                    </p>
                  )}
                  <div className="mt-8 pt-6 border-t-2 border-white/30">
                    <p className="text-sm text-green-100 mb-2">Перевод:</p>
                    <p className="text-2xl text-white font-medium">
                      {frontFlag} {frontText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки ответа */}
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
            <p className="text-lg">
              Подумай над ответом, затем нажми на карточку
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
