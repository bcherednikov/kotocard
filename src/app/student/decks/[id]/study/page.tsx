'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  ru_transcription: string | null;
  audio_url: string | null;
};

type Direction = 'ru_to_en' | 'en_to_ru';

export default function StudyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const deckId = params.id as string;
  const direction = (searchParams.get('direction') || 'ru_to_en') as Direction;

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0
  });
  // Сохранять ответы для батчевого сохранения в конце
  const [answers, setAnswers] = useState<Array<{ cardId: string; isCorrect: boolean }>>([]);

  useEffect(() => {
    if (profile && deckId) {
      loadCards();
    }
  }, [profile, deckId]);

  async function loadCards() {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('position', { ascending: true });

      if (error) throw error;

      // Перемешать карточки для разнообразия
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } catch (err) {
      console.error('Ошибка загрузки карточек:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(isCorrect: boolean) {
    if (!user || !cards[currentIndex]) return;

    const card = cards[currentIndex];

    // Сохранить ответ для батчевой отправки
    setAnswers(prev => [...prev, { cardId: card.id, isCorrect }]);

    // Обновить статистику сессии
    const newStats = {
      correct: isCorrect ? sessionStats.correct + 1 : sessionStats.correct,
      incorrect: !isCorrect ? sessionStats.incorrect + 1 : sessionStats.incorrect
    };
    setSessionStats(newStats);

    // Переход к следующей карточке
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Сохранить все ответы батчем в конце сессии
      await saveAllProgress([...answers, { cardId: card.id, isCorrect }]);
      
      // Редирект на результаты
      router.push(`/student/decks/${deckId}/complete?correct=${newStats.correct}&incorrect=${newStats.incorrect}`);
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
          // Обновить
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
          // Создать
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
    // Проверить поддержку Web Speech API
    if (!('speechSynthesis' in window)) {
      alert('Ваш браузер не поддерживает озвучку');
      return;
    }

    // Остановить предыдущую озвучку если есть
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 0.9; // Немного медленнее для лучшего понимания
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
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
          <Link
            href={`/student/decks/${deckId}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад
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
  
  // Показывать транскрипцию везде где показывается английское слово
  const showTranscriptionOnFront = profile?.show_russian_transcription && 
                                   direction === 'en_to_ru' && 
                                   currentCard.ru_transcription;
  
  const showTranscriptionOnBack = profile?.show_russian_transcription && 
                                  direction === 'ru_to_en' && 
                                  currentCard.ru_transcription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Прогресс */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href={`/student/decks/${deckId}`}
            className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium"
          >
            ← Выход
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
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
          className={`relative mb-8 ${!isFlipped ? 'cursor-pointer' : ''}`}
          style={{ perspective: '1000px', height: '400px' }}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(frontText, direction === 'ru_to_en' ? 'ru' : 'en');
                      }}
                      className="text-4xl hover:scale-110 transition-transform active:scale-95"
                      title="Прослушать"
                    >
                      🔊
                    </button>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(backText, direction === 'ru_to_en' ? 'en' : 'ru');
                      }}
                      className="text-4xl hover:scale-110 transition-transform active:scale-95"
                      title="Прослушать"
                    >
                      🔊
                    </button>
                  </div>
                  {showTranscriptionOnBack && (
                    <p className="text-xl text-yellow-200 mb-8 italic">
                      [{currentCard.ru_transcription}]
                    </p>
                  )}
                  <div className="mt-8 pt-6 border-t-2 border-white/30">
                    <p className="text-sm text-green-100 mb-2">Перевод:</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-2xl text-white font-medium">
                        {frontFlag} {frontText}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(frontText, direction === 'ru_to_en' ? 'ru' : 'en');
                        }}
                        className="text-2xl hover:scale-110 transition-transform active:scale-95"
                        title="Прослушать перевод"
                      >
                        🔊
                      </button>
                    </div>
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
