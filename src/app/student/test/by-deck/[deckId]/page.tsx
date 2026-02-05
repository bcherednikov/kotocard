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

type Deck = {
  id: string;
  name: string;
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

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (user && profile && deckId) {
      loadDeckAndGenerateTest();
    }
  }, [user, profile, deckId]);

  async function loadDeckAndGenerateTest() {
    try {
      // Загрузить информацию о наборе
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('id, name')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;
      setDeck(deckData);

      // Загрузить изученные карточки из этого набора
      const { data: progress, error: progressError } = await supabase
        .from('card_progress')
        .select('card_id')
        .eq('user_id', user!.id);

      if (progressError) throw progressError;

      if (!progress || progress.length === 0) {
        alert('У тебя пока нет изученных слов из этого набора!');
        router.push('/student/test/by-deck');
        return;
      }

      const studiedCardIds = progress.map(p => p.card_id);

      // Загрузить карточки именно из этого набора
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .in('id', studiedCardIds);

      if (cardsError) throw cardsError;

      if (!allCards || allCards.length < 4) {
        alert(`Недостаточно изученных слов из набора "${deckData.name}" для теста (минимум 4). Продолжай учиться!`);
        router.push('/student/test/by-deck');
        return;
      }

      // Взять случайные 10 карточек (или меньше если нет 10)
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      const selectedCards = shuffled.slice(0, Math.min(10, shuffled.length));

      // Создать сессию теста
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user!.id,
          total_questions: selectedCards.length,
          correct_answers: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Генерировать вопросы
      const generatedQuestions = selectedCards.map(card => generateQuestion(card, allCards));
      setQuestions(generatedQuestions);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка генерации теста:', err);
      alert('Произошла ошибка при создании теста');
      router.push('/student/test/by-deck');
    }
  }

  function generateQuestion(card: Card, allCards: Card[]): Question {
    // Случайный тип отображения вопроса
    const displayTypes: QuestionDisplay[] = ['text_en', 'text_ru', 'audio_en', 'audio_ru'];
    const display = displayTypes[Math.floor(Math.random() * displayTypes.length)];

    // Определить язык вопроса
    const questionLang = display.includes('_en') ? 'en' : 'ru';
    
    // Язык ответа ВСЕГДА противоположный языку вопроса
    const answerLang = questionLang === 'en' ? 'ru' : 'en';

    // Случайный режим ответа (с учётом языка)
    let answerMode: AnswerMode;
    const rand = Math.random();
    
    if (answerLang === 'en') {
      // Ответ на английском
      if (rand < 0.4) answerMode = 'choice_text_en';
      else if (rand < 0.7) answerMode = 'choice_audio_en';
      else answerMode = 'input_en';
    } else {
      // Ответ на русском
      if (rand < 0.5) answerMode = 'choice_text_ru';
      else answerMode = 'input_ru';
    }

    // Правильный ответ
    const correctAnswer = answerLang === 'en' ? card.en_text : card.ru_text;

    // Генерация опций для multiple choice
    let options: Card[] | undefined;
    if (answerMode.startsWith('choice_')) {
      const otherCards = allCards.filter(c => c.id !== card.id);
      const shuffled = [...otherCards].sort(() => Math.random() - 0.5);
      const wrongOptions = shuffled.slice(0, 3);
      options = [card, ...wrongOptions].sort(() => Math.random() - 0.5);
    }

    return {
      id: card.id,
      card,
      display,
      answerMode,
      options,
      correctAnswer
    };
  }

  function speakText(text: string, lang: 'en' | 'ru') {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  function handleAnswer(answer: string) {
    if (showFeedback || isProcessing) return;

    const question = questions[currentQuestionIndex];
    const correct = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    
    setUserAnswer(answer);
    setIsCorrect(correct);
    setShowFeedback(true);

    const timeSpent = Date.now() - questionStartTime;
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
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Сохранить результат текущего вопроса
      const question = questions[currentQuestionIndex];
      const result = results[results.length - 1];

      await supabase.from('test_results').insert({
        session_id: sessionId!,
        card_id: question.card.id,
        question_text: getQuestionText(question),
        question_lang: question.display.includes('_en') ? 'en' : 'ru',
        answer_text: result.userAnswer,
        answer_lang: question.answerMode.includes('_en') || question.answerMode === 'input_en' ? 'en' : 'ru',
        is_correct: result.isCorrect
      });

      // Следующий вопрос или завершение
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setUserAnswer('');
        setShowFeedback(false);
        setIsCorrect(false);
        setQuestionStartTime(Date.now());
        setIsProcessing(false);
      } else {
        // Завершить тест
        const correctCount = results.filter(r => r.isCorrect).length;
        await supabase
          .from('test_sessions')
          .update({
            completed_at: new Date().toISOString(),
            correct_answers: correctCount
          })
          .eq('id', sessionId!);

        router.push(`/student/test/random-mix/complete?session=${sessionId}`);
      }
    } catch (err) {
      console.error('Ошибка сохранения результата:', err);
      setIsProcessing(false);
    }
  }

  function getQuestionText(question: Question): string {
    if (question.display === 'text_en') return question.card.en_text;
    if (question.display === 'text_ru') return question.card.ru_text;
    if (question.display === 'audio_en') return `🔊 ${question.card.en_text}`;
    if (question.display === 'audio_ru') return `🔊 ${question.card.ru_text}`;
    return '';
  }

  function getInstruction(question: Question): string {
    const { display, answerMode } = question;
    
    if (display.startsWith('audio_')) {
      // Аудио вопрос
      if (answerMode.startsWith('input_')) {
        // Диктант
        return answerMode === 'input_en' 
          ? '🎧 Прослушай и напиши перевод на английском'
          : '🎧 Прослушай и напиши перевод на русском';
      } else if (answerMode.startsWith('choice_audio_')) {
        return '🎧 Прослушай слово и выбери правильный перевод на слух';
      } else {
        return '🎧 Прослушай слово и выбери правильный перевод';
      }
    } else {
      // Текстовый вопрос
      const questionLang = display === 'text_en' ? 'английском' : 'русском';
      const answerLang = answerMode.includes('_en') || answerMode === 'input_en' ? 'английском' : 'русском';
      
      if (answerMode.startsWith('input_')) {
        return `📝 Напиши перевод на ${answerLang}`;
      } else if (answerMode.startsWith('choice_audio_')) {
        return `🔊 Выбери правильное произношение перевода`;
      } else {
        return `✅ Выбери правильный перевод`;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Недостаточно карточек</h1>
          <p className="text-gray-700 mb-6">
            Для теста нужно изучить минимум 4 карточки из этого набора
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
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header с названием набора */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span className="text-2xl">📚</span>
            <span className="font-semibold text-gray-900">{deck?.name}</span>
          </div>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Карточка вопроса */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          {/* Инструкция */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-blue-900 font-medium">
              {getInstruction(currentQuestion)}
            </p>
          </div>

          {/* Вопрос */}
          <div className="mb-8">
            {currentQuestion.display.startsWith('audio_') ? (
              <div className="text-center">
                <button
                  onClick={() => {
                    const lang = currentQuestion.display === 'audio_en' ? 'en' : 'ru';
                    const text = lang === 'en' ? currentQuestion.card.en_text : currentQuestion.card.ru_text;
                    speakText(text, lang);
                  }}
                  className="px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl text-3xl hover:scale-110 transition-transform shadow-lg"
                >
                  🔊 Прослушать
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {currentQuestion.display === 'text_en' ? currentQuestion.card.en_text : currentQuestion.card.ru_text}
                </div>
              </div>
            )}
          </div>

          {/* Ответы */}
          {!showFeedback && (
            <div>
              {currentQuestion.answerMode.startsWith('choice_') ? (
                // Multiple choice
                <div className="space-y-3">
                  {currentQuestion.answerMode === 'choice_audio_en' ? (
                    // Аудио варианты
                    currentQuestion.options?.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          speakText(option.en_text, 'en');
                          handleAnswer(option.en_text);
                        }}
                        className="w-full p-4 bg-gray-100 hover:bg-blue-100 rounded-xl text-left font-medium transition flex items-center gap-3"
                      >
                        <span className="text-2xl">🔊</span>
                        <span>Прослушать вариант</span>
                      </button>
                    ))
                  ) : (
                    // Текстовые варианты
                    currentQuestion.options?.map((option) => {
                      const optionText = currentQuestion.answerMode.includes('_en') 
                        ? option.en_text 
                        : option.ru_text;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleAnswer(optionText)}
                          className="w-full p-4 bg-gray-100 hover:bg-blue-100 rounded-xl text-left font-medium text-lg transition"
                        >
                          {optionText}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                // Input (диктант)
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
                    className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg mb-4 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAnswer(userAnswer)}
                    disabled={!userAnswer.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Проверить
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className={`p-6 rounded-xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{isCorrect ? '✅' : '❌'}</div>
                <div className="text-2xl font-bold mb-2">
                  {isCorrect ? 'Правильно!' : 'Неправильно'}
                </div>
                {!isCorrect && (
                  <div className="text-lg">
                    <span className="text-gray-600">Правильный ответ:</span>
                    <div className="font-bold text-gray-900 mt-1">{currentQuestion.correctAnswer}</div>
                  </div>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isProcessing ? 'Сохранение...' : (currentQuestionIndex < questions.length - 1 ? 'Следующий вопрос →' : 'Завершить тест')}
              </button>
            </div>
          )}
        </div>

        {/* Кнопка выхода */}
        <div className="text-center">
          <Link
            href="/student/test/by-deck"
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Выбрать другой набор
          </Link>
        </div>
      </div>
    </div>
  );
}
