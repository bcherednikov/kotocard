'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllDeckCards } from '@/lib/srs/queries';
import type { CardData } from '@/lib/srs/types';

const TOTAL_HINTS = 20;
const HINTS_PER_USE = 2;

type WordTask = {
  card: CardData;
  lang: 'en' | 'ru';       // language spoken aloud
  spokenText: string;       // text that is spoken (en_text or ru_text)
  answer: string;           // correct answer — always en_text
};

export default function DictationPrepPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const deckId = params.id as string;

  const [tasks, setTasks] = useState<WordTask[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [hintsRemaining, setHintsRemaining] = useState(TOTAL_HINTS);
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (profile && deckId) loadCards();
  }, [profile, deckId]);

  async function loadCards() {
    try {
      const cards = await getAllDeckCards(supabase, deckId);
      if (cards.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Shuffle and assign random language per card
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      const wordTasks: WordTask[] = shuffled.map((card) => {
        const lang = Math.random() < 0.5 ? 'en' : 'ru';
        return {
          card,
          lang,
          spokenText: lang === 'en' ? card.en_text : card.ru_text,
          answer: card.en_text, // always write in English
        };
      });

      setTasks(wordTasks);
    } catch (err) {
      console.error('Error loading cards:', err);
    } finally {
      setLoading(false);
    }
  }

  const speakCurrent = useCallback(async (task: WordTask) => {
    try {
      const { playTts } = await import('@/lib/tts');
      await playTts(task.spokenText, task.lang);
    } catch (e) {
      console.error('TTS:', e);
    }
  }, []);

  // Auto-play when card changes (skip initial load)
  useEffect(() => {
    if (tasks.length > 0 && !showFeedback && hasNavigated.current) {
      speakCurrent(tasks[currentIndex]);
    }
  }, [currentIndex, tasks, showFeedback, speakCurrent]);

  function useHint() {
    if (hintsRemaining <= 0) return;

    const word = tasks[currentIndex].answer;
    const hiddenIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (!revealedLetters.has(i) && word[i] !== ' ') {
        hiddenIndices.push(i);
      }
    }

    if (hiddenIndices.length === 0) return;

    // Reveal up to 2 random hidden letters
    const toReveal = Math.min(HINTS_PER_USE, hiddenIndices.length);
    const shuffled = [...hiddenIndices].sort(() => Math.random() - 0.5);
    const newRevealed = new Set(revealedLetters);
    for (let i = 0; i < toReveal; i++) {
      newRevealed.add(shuffled[i]);
    }

    setRevealedLetters(newRevealed);
    setHintsRemaining(hintsRemaining - 1);
  }

  function handleSubmit() {
    const trimmed = userInput.trim();
    if (!trimmed) return;

    const correct = trimmed.toLowerCase() === tasks[currentIndex].answer.toLowerCase();
    setLastCorrect(correct);
    setShowFeedback(true);
    setStats({
      correct: correct ? stats.correct + 1 : stats.correct,
      incorrect: !correct ? stats.incorrect + 1 : stats.incorrect,
    });
  }

  function handleNext() {
    hasNavigated.current = true;
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setRevealedLetters(new Set());
      setShowFeedback(false);
    } else {
      setFinished(true);
      setShowFeedback(false);
    }
  }

  function renderMask(word: string): React.ReactNode {
    return (
      <div className="flex flex-wrap justify-center gap-1.5 my-6">
        {word.split('').map((char, i) => {
          if (char === ' ') {
            return <div key={i} className="w-4" />;
          }
          const isRevealed = revealedLetters.has(i);
          return (
            <div
              key={i}
              className={`w-10 h-12 flex items-center justify-center rounded-lg text-2xl font-bold ${
                isRevealed
                  ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-800'
                  : 'bg-gray-100 border-2 border-gray-300 text-gray-400'
              }`}
            >
              {isRevealed ? char : '_'}
            </div>
          );
        })}
      </div>
    );
  }

  // Check if all letters are revealed (hint not useful)
  const allRevealed = tasks[currentIndex]
    ? tasks[currentIndex].answer.split('').every((ch, i) => ch === ' ' || revealedLetters.has(i))
    : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка диктанта...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек</h1>
          <p className="text-gray-700 mb-6">В этом наборе пока нет карточек для диктанта</p>
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

  if (finished) {
    const total = stats.correct + stats.incorrect;
    const percent = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">
              {percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Диктант завершён!</h1>
            <p className="text-lg text-gray-600 mb-8">Вот твои результаты:</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-sm text-green-700">Правильно</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
                <div className="text-sm text-red-700">Ошибок</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-indigo-600">{percent}%</div>
                <div className="text-sm text-indigo-700">Точность</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-4 bg-gray-100 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href={`/student/decks/${deckId}`}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                ← К набору
              </Link>
              <button
                onClick={() => {
                  setFinished(false);
                  setCurrentIndex(0);
                  setUserInput('');
                  setRevealedLetters(new Set());
                  setShowFeedback(false);
                  setStats({ correct: 0, incorrect: 0 });
                  setHintsRemaining(TOTAL_HINTS);
                  hasNavigated.current = false;
                  loadCards();
                }}
                className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition"
              >
                Пройти ещё раз
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href={`/student/decks/${deckId}`}
            className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium"
          >
            ← Выход
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
              {currentIndex + 1} из {tasks.length}
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                ✓ {stats.correct}
              </span>
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                ✗ {stats.incorrect}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/50 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / tasks.length) * 100}%` }}
          />
        </div>

        {!showFeedback ? (
          <>
            {/* Question area */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-2">
                  {currentTask.lang === 'en'
                    ? 'Послушай и напиши слово на английском:'
                    : 'Переведи на английский и напиши:'}
                </p>

                {/* Play button */}
                <button
                  onClick={() => speakCurrent(currentTask)}
                  className="px-8 py-4 bg-indigo-500 text-white rounded-xl text-2xl hover:bg-indigo-600 transition active:scale-95 mb-4"
                >
                  🔊 Воспроизвести
                </button>

                {/* Language badge */}
                <div className="mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    currentTask.lang === 'en'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentTask.lang === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
                  </span>
                </div>

                {/* Masked answer (always English) */}
                {renderMask(currentTask.answer)}

                {/* Hint button */}
                <button
                  onClick={useHint}
                  disabled={hintsRemaining <= 0 || allRevealed}
                  className="px-6 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-500 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  💡 Подсказка ({hintsRemaining})
                </button>
              </div>
            </div>

            {/* Input area */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && userInput.trim()) {
                    handleSubmit();
                  }
                }}
                placeholder="Напиши слово на английском..."
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-xl text-gray-900 focus:border-indigo-500 focus:outline-none mb-4"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="w-full py-4 bg-indigo-500 text-white rounded-xl font-bold text-xl hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ответить
              </button>
            </div>
          </>
        ) : (
          /* Feedback */
          <div className={`rounded-2xl shadow-2xl p-8 text-center ${
            lastCorrect
              ? 'bg-gradient-to-br from-green-400 to-green-600'
              : 'bg-gradient-to-br from-red-400 to-red-600'
          }`}>
            <div className="text-white">
              <div className="text-6xl mb-4">
                {lastCorrect ? '✅' : '❌'}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {lastCorrect ? 'Правильно!' : 'Неправильно'}
              </h2>

              {!lastCorrect && (
                <div className="mb-4">
                  <p className="text-white/80 text-sm mb-1">Правильный ответ:</p>
                  <p className="text-2xl font-bold">{currentTask.answer}</p>
                </div>
              )}

              {!lastCorrect && (
                <div className="mb-4">
                  <p className="text-white/80 text-sm mb-1">Ты написал:</p>
                  <p className="text-xl">{userInput}</p>
                </div>
              )}

              <button
                onClick={handleNext}
                className="mt-4 px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-xl hover:bg-gray-100 transition"
              >
                {currentIndex < tasks.length - 1 ? 'Далее →' : 'Завершить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
