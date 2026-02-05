'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

type Card = {
  id: string;
  ru_text: string;
  en_text: string;
  ru_transcription: string | null;
};

type QuestionDisplay = 'text_en' | 'text_ru' | 'audio_en' | 'audio_ru';
type AnswerMode = 'choice_text_en' | 'choice_text_ru' | 'choice_audio_en' | 'input_en' | 'input_ru';

type Question = {
  id: string;
  card: Card;
  display: QuestionDisplay;
  answerMode: AnswerMode;
  options?: Card[];
  correctAnswer: string;
};

type QuestionResult = {
  cardId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
};

export default function DeckTestPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [deckName, setDeckName] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user && profile) {
      generateDeckTest();
    }
  }, [user, profile, deckId]);

  async function generateDeckTest() {
    try {
      // 1. Загрузить название набора (для заголовка)
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      if (!deckError && deckData?.name) {
        setDeckName(deckData.name);
      }

      // 2. Загрузить все карточки из выбранного набора
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId);

      if (cardsError) throw cardsError;

      if (!allCards || allCards.length < 4) {
        alert('Недостаточно слов в этом наборе для теста (минимум 4). Попроси родителей добавить больше карточек!');
        router.push('/student/test/by-deck');
        return;
      }

      // 3. Взять случайные 10 карточек (или меньше если нет 10) — как в случайном миксе
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      const selectedCards = shuffled.slice(0, Math.min(10, shuffled.length));

      // 4. Создать сессию теста (та же схема, что и в случайном миксе)
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user!.id,
          mode: 'by_deck',
          total_questions: selectedCards.length,
          correct_count: 0,
          incorrect_count: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // 5. Сгенерировать вопросы (та же логика, что и в случайном миксе)
      const generatedQuestions: Question[] = selectedCards.map(card => {
        return generateQuestion(card, allCards);
      });

      setQuestions(generatedQuestions);
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Ошибка генерации теста:', err);
      alert('Произошла ошибка при создании теста');
      router.push('/student/test/by-deck');
    } finally {
      setLoading(false);
    }
  }

  function generateQuestion(card: Card, allCards: Card[]): Question {
    // Случайный тип отображения вопроса — как в случайном миксе
    const displayTypes: QuestionDisplay[] = ['text_en', 'text_ru', 'audio_en', 'audio_ru'];
    const display = displayTypes[Math.floor(Math.random() * displayTypes.length)];

    // Определить язык вопроса и ответа (всегда противоположные!)
    const questionIsEnglish = display.includes('_en');
    const answerLang = questionIsEnglish ? '_ru' : '_en';

    // Случайный тип ответа (но на ПРОТИВОПОЛОЖНОМ языке)
    const answerTypes = ['choice_text', 'choice_audio', 'input'];
    const answerType = answerTypes[Math.floor(Math.random() * answerTypes.length)];
    const answerMode = (answerType + answerLang) as AnswerMode;

    // Определить правильный ответ
    const correctAnswer = questionIsEnglish ? card.ru_text : card.en_text;

    // Если multiple choice - добавить неправильные варианты
    let options: Card[] | undefined;
    if (answerMode.startsWith('choice_')) {
      const otherCards = allCards.filter(c => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
      const wrongOptions = shuffledOthers.slice(0, 3);
      options = [card, ...wrongOptions].sort(() => Math.random() - 0.5);
    }

    return {
      id: crypto.randomUUID(),
      card,
      display,
      answerMode,
      options,
      correctAnswer
    };
  }

  function speakText(text: string, lang: 'en' | 'ru') {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function handleAnswer(answer: string) {
    const question = questions[currentQuestionIndex];
    const timeSpent = Date.now() - questionStartTime;
    
    // Проверка ответа (без учёта регистра)
    const correct = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    
    setIsCorrect(correct);
    setShowFeedback(true);
    setUserAnswer(answer);

    // Сохранить результат
    const result: QuestionResult = {
      cardId: question.card.id,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: correct,
      timeSpent
    };
    setResults(prev => [...prev, result]);
  }

  async function handleNext() {
    if (isProcessing) return; // Защита от двойного клика
    setIsProcessing(true);

    const question = questions[currentQuestionIndex];

    try {
      // Сохранить результат вопроса в БД — те же поля, что и в случайном миксе
      if (sessionId) {
        await supabase.from('test_results').insert({
          session_id: sessionId,
          card_id: question.card.id,
          question_display: question.display,
          answer_mode: question.answerMode,
          user_answer: userAnswer,
          correct_answer: question.correctAnswer,
          is_correct: isCorrect,
          time_spent_ms: Date.now() - questionStartTime
        });
      }

      // Следующий вопрос или завершение
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowFeedback(false);
        setUserAnswer('');
        setQuestionStartTime(Date.now());
        setIsProcessing(false);
      } else {
        // Завершить сессию (аналогично случайному миксу)
        if (sessionId) {
          const correctCount = results.filter(r => r.isCorrect).length + (isCorrect ? 1 : 0);
          const incorrectCount = results.length + 1 - correctCount;

          await supabase
            .from('test_sessions')
            .update({
              correct_count: correctCount,
              incorrect_count: incorrectCount,
              completed_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        }

        // Редирект на общий экран результатов (он уже умеет работать с любыми режимами)
        router.push(`/student/test/random-mix/complete?session=${sessionId}`);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setIsProcessing(false);
    }
  }

  function getInstruction(question: Question): string {
    const { display, answerMode } = question;
    const isAudioQuestion = display.startsWith('audio_');
    const isChoice = answerMode.startsWith('choice_');
    const isAudioChoice = answerMode === 'choice_audio_en';

    if (isChoice) {
      if (isAudioChoice) {
        return '🔊 Прослушай варианты и выбери правильный перевод';
      } else {
        return '✅ Выбери правильный перевод';
      }
    } else {
      // Input mode - диктант
      if (isAudioQuestion) {
        return '🎧 Прослушай и напиши перевод';
      } else {
        return '✍️ Напиши перевод';
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-xl text-gray-800">Генерируем тест...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Не удалось создать тест</h1>
          <p className="text-gray-700 mb-6">
            Попробуй выбрать другой набор или повторить попытку позже
          </p>
          <Link
            href="/student/test/by-deck"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Выбрать другой набор
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Верхняя панель — как в случайном миксе, но с названием набора */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/student/test/by-deck"
            className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium"
          >
            ← Назад к выбору темы
          </Link>
          <div className="text-center">
            <div className="text-sm text-gray-500">Тест по теме</div>
            {deckName && (
              <div className="text-lg font-semibold text-gray-900">{deckName}</div>
            )}
          </div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="text-green-600 font-semibold">
              ✓ {results.filter(r => r.isCorrect).length}
            </span>
            {' / '}
            <span className="text-red-600 font-semibold">
              ✗ {results.filter(r => !r.isCorrect).length}
            </span>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full h-2 bg-white/50 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Карточка вопроса — структура и стили как в случайном миксе */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* Вопрос */}
          <div className="mb-6">
            {currentQuestion.display.startsWith('text_') ? (
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {currentQuestion.display.includes('_en') ? '🇬🇧' : '🇷🇺'}
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-4">
                  {currentQuestion.display === 'text_en'
                    ? currentQuestion.card.en_text
                    : currentQuestion.card.ru_text}
                </p>
                {currentQuestion.display === 'text_en' && (
                  <button
                    onClick={() => speakText(currentQuestion.card.en_text, 'en')}
                    className="text-3xl hover:scale-110 transition-transform"
                    title="Прослушать"
                  >
                    🔊
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {currentQuestion.display.includes('_en') ? '🇬🇧' : '🇷🇺'}
                </div>
                <p className="text-xl text-gray-700 mb-4">Прослушай слово:</p>
                <button
                  onClick={() =>
                    speakText(
                      currentQuestion.display === 'audio_en'
                        ? currentQuestion.card.en_text
                        : currentQuestion.card.ru_text,
                      currentQuestion.display === 'audio_en' ? 'en' : 'ru'
                    )
                  }
                  className="px-8 py-4 bg-blue-500 text-white rounded-xl text-2xl hover:bg-blue-600 transition active:scale-95"
                >
                  🔊 Воспроизвести
                </button>
              </div>
            )}
          </div>

          {/* Инструкция */}
          <div className="mt-4 text-center text-lg font-semibold text-gray-700">
            {getInstruction(currentQuestion)}
          </div>
        </div>

        {/* Ответ */}
        {!showFeedback && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {renderAnswerInput(currentQuestion)}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className={`rounded-2xl shadow-xl p-8 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{isCorrect ? '✅' : '❌'}</div>
              <h2
                className={`text-3xl font-bold mb-2 ${
                  isCorrect ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {isCorrect ? 'Правильно!' : 'Неправильно'}
              </h2>
              {!isCorrect && (
                <div className="mt-4">
                  <p className="text-gray-700 mb-2">Правильный ответ:</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentQuestion.correctAnswer}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-xl hover:from-purple-600 hover:to-pink-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? 'Сохраняем...'
                : currentQuestionIndex < questions.length - 1
                ? 'Следующий вопрос →'
                : 'Завершить тест 🏁'}
            </button>
          </div>
        )}

      </div>
    </div>
  );

  function renderAnswerInput(question: Question) {
    const { answerMode, options } = question;

    if (answerMode.startsWith('choice_')) {
      // Multiple choice — тот же шаблон, что и в случайном миксе
      const isAudioChoice = answerMode === 'choice_audio_en';

      return (
        <div className="space-y-3">
          {options?.map((option, index) => (
            <button
              key={option.id}
              onClick={() => {
                if (isAudioChoice) {
                  speakText(option.en_text, 'en');
                } else {
                  const answer = answerMode.includes('_en') ? option.en_text : option.ru_text;
                  handleAnswer(answer);
                }
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition text-lg font-medium text-gray-900"
            >
              {isAudioChoice ? (
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🔊</span>
                  <span>Вариант {index + 1}</span>
                </span>
              ) : (
                <span>{answerMode.includes('_en') ? option.en_text : option.ru_text}</span>
              )}
            </button>
          ))}

          {isAudioChoice && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3 text-center">
                Выбери правильный вариант:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {options?.map((option, index) => (
                  <button
                    key={`select-${option.id}`}
                    onClick={() => handleAnswer(option.en_text)}
                    className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-semibold"
                  >
                    Вариант {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Text input
      return (
        <div>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && userAnswer.trim()) {
                handleAnswer(userAnswer);
              }
            }}
            placeholder="Введи ответ..."
            className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-xl text-gray-900 focus:border-blue-500 focus:outline-none mb-4"
            autoFocus
          />
          <button
            onClick={() => handleAnswer(userAnswer)}
            disabled={!userAnswer.trim()}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-xl hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ответить
          </button>
        </div>
      );
    }
  }
}
