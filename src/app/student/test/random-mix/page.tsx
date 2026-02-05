'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
  options?: Card[];  // Для multiple choice
  correctAnswer: string;
};

type QuestionResult = {
  cardId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
};

export default function RandomMixTestPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (user && profile) {
      generateTest();
    }
  }, [user, profile]);

  async function generateTest() {
    try {
      // 1. Загрузить изученные карточки (где times_correct > 0)
      const { data: progress, error: progressError } = await supabase
        .from('card_progress')
        .select('card_id')
        .eq('user_id', user!.id)
        .gt('times_correct', 0);

      if (progressError) throw progressError;

      if (!progress || progress.length === 0) {
        alert('У тебя пока нет изученных слов! Сначала пройди обучение.');
        router.push('/student/decks');
        return;
      }

      const studiedCardIds = progress.map(p => p.card_id);

      // 2. Загрузить карточки
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('id', studiedCardIds);

      if (cardsError) throw cardsError;

      if (!allCards || allCards.length < 4) {
        alert('Недостаточно изученных слов для теста (минимум 4). Продолжай учиться!');
        router.push('/student/decks');
        return;
      }

      // 3. Взять случайные 10 карточек (или меньше если нет 10)
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      const selectedCards = shuffled.slice(0, Math.min(10, shuffled.length));

      // 4. Создать сессию теста
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user!.id,
          mode: 'random_mix',
          total_questions: selectedCards.length
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // 5. Сгенерировать вопросы
      const generatedQuestions: Question[] = selectedCards.map(card => {
        return generateQuestion(card, allCards);
      });

      setQuestions(generatedQuestions);
      setQuestionStartTime(Date.now());
    } catch (err) {
      console.error('Ошибка генерации теста:', err);
      alert('Ошибка создания теста');
    } finally {
      setLoading(false);
    }
  }

  function generateQuestion(card: Card, allCards: Card[]): Question {
    // Случайный тип отображения вопроса
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
    const question = questions[currentQuestionIndex];

    // Сохранить результат вопроса в БД
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
    } else {
      // Завершить сессию
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

      // Редирект на результаты
      const correctCount = results.filter(r => r.isCorrect).length + (isCorrect ? 1 : 0);
      router.push(`/student/test/random-mix/complete?session=${sessionId}&correct=${correctCount}&total=${questions.length}`);
    }
  }

  function speakText(text: string, lang: 'en' | 'ru') {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Готовим тест...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-800 mb-4">Не удалось создать тест</p>
          <Link href="/student/test" className="text-blue-600 hover:text-blue-800">
            ← Назад
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Прогресс */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/student/test"
            className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium"
          >
            ← Выход
          </Link>
          <div className="text-lg font-semibold text-gray-800">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
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

        {/* Вопрос - продолжу в следующем файле */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* QuestionDisplay Component */}
          {renderQuestionDisplay(currentQuestion)}
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
              <h2 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Правильно!' : 'Неправильно'}
              </h2>
              {!isCorrect && (
                <div className="mt-4">
                  <p className="text-gray-700 mb-2">Правильный ответ:</p>
                  <p className="text-2xl font-bold text-gray-900">{currentQuestion.correctAnswer}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-xl hover:from-purple-600 hover:to-pink-700 transition shadow-lg"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить тест 🏁'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function renderQuestionDisplay(question: Question) {
    const { display, card } = question;

    // Текст вопроса
    let questionText = '';
    if (display === 'text_en' || display === 'audio_en') {
      questionText = display === 'text_en' ? card.en_text : '';
    } else {
      questionText = display === 'text_ru' ? card.ru_text : '';
    }

    return (
      <div className="text-center">
        <div className="text-5xl mb-6">
          {display.includes('_en') ? '🇬🇧' : '🇷🇺'}
        </div>
        
        {display.startsWith('text_') ? (
          <div>
            <p className="text-4xl font-bold text-gray-900 mb-6">{questionText}</p>
            {display === 'text_en' && (
              <button
                onClick={() => speakText(card.en_text, 'en')}
                className="text-3xl hover:scale-110 transition-transform"
                title="Прослушать"
              >
                🔊
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xl text-gray-700 mb-6">Прослушай слово:</p>
            <button
              onClick={() => speakText(
                display === 'audio_en' ? card.en_text : card.ru_text,
                display === 'audio_en' ? 'en' : 'ru'
              )}
              className="px-8 py-4 bg-blue-500 text-white rounded-xl text-2xl hover:bg-blue-600 transition active:scale-95"
            >
              🔊 Воспроизвести
            </button>
          </div>
        )}

        <div className="mt-6 text-lg font-semibold text-gray-700">
          {getInstruction(question)}
        </div>
      </div>
    );
  }

  function renderAnswerInput(question: Question) {
    const { answerMode, options } = question;

    if (answerMode.startsWith('choice_')) {
      // Multiple choice
      return (
        <div className="space-y-3">
          {options?.map((option, index) => {
            const isAudioChoice = answerMode === 'choice_audio_en';
            
            return (
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
            );
          })}
          
          {answerMode === 'choice_audio_en' && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3 text-center">Выбери правильный вариант:</p>
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
