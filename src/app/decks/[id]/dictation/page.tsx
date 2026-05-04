'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { getAllDeckCards } from '@/lib/srs/queries';
import type { CardData } from '@/lib/srs/types';
import { trackActivityInBackground } from '@/lib/analytics/tracker';
import { ImmersiveShell } from '@/components/layout/ImmersiveShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TOTAL_HINTS = 20;
const HINTS_PER_USE = 2;

type WordTask = {
  card: CardData;
  lang: 'en' | 'ru';
  spokenText: string;
  answer: string;
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
      if (cards.length === 0) { setTasks([]); setLoading(false); return; }
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      const wordTasks: WordTask[] = shuffled.map((card) => {
        const lang = Math.random() < 0.5 ? 'en' : 'ru';
        return { card, lang, spokenText: lang === 'en' ? card.en_text : card.ru_text, answer: card.en_text };
      });
      setTasks(wordTasks);
      if (wordTasks.length > 0 && profile) {
        trackActivityInBackground(supabase, profile.id, { study_sessions: 1 });
      }
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
      if (!revealedLetters.has(i) && word[i] !== ' ') hiddenIndices.push(i);
    }
    if (hiddenIndices.length === 0) return;
    const toReveal = Math.min(HINTS_PER_USE, hiddenIndices.length);
    const shuffled = [...hiddenIndices].sort(() => Math.random() - 0.5);
    const newRevealed = new Set(revealedLetters);
    for (let i = 0; i < toReveal; i++) newRevealed.add(shuffled[i]);
    setRevealedLetters(newRevealed);
    setHintsRemaining(hintsRemaining - 1);
  }

  function handleSubmit() {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    const correct = trimmed.toLowerCase() === tasks[currentIndex].answer.toLowerCase();
    setLastCorrect(correct);
    setShowFeedback(true);
    setStats({ correct: correct ? stats.correct + 1 : stats.correct, incorrect: !correct ? stats.incorrect + 1 : stats.incorrect });
    if (profile) {
      if (correct) trackActivityInBackground(supabase, profile.id, { dictation_tests_passed: 1, tests_passed: 1 });
      else trackActivityInBackground(supabase, profile.id, { tests_failed: 1 });
    }
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
          if (char === ' ') return <div key={i} className="w-4" />;
          const isRevealed = revealedLetters.has(i);
          return (
            <div key={i} className={`w-10 h-12 flex items-center justify-center rounded-xl text-xl font-bold border ${
              isRevealed ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}>
              {isRevealed ? char : '_'}
            </div>
          );
        })}
      </div>
    );
  }

  const allRevealed = tasks[currentIndex]
    ? tasks[currentIndex].answer.split('').every((ch, i) => ch === ' ' || revealedLetters.has(i))
    : false;

  const progress = tasks.length > 0 ? Math.round(((currentIndex + 1) / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Диктант">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">Загрузка диктанта...</p>
        </div>
      </ImmersiveShell>
    );
  }

  if (tasks.length === 0) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Диктант">
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Нет карточек</h1>
            <p className="text-gray-500 text-sm">В этом наборе пока нет карточек для диктанта</p>
          </div>
        </div>
      </ImmersiveShell>
    );
  }

  if (finished) {
    const total = stats.correct + stats.incorrect;
    const percent = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Результаты">
        <div className="flex items-center justify-center py-8 px-4 h-full">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">{percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Диктант завершён!</h1>
              <p className="text-gray-500 text-sm mb-7">Вот твои результаты:</p>

              <div className="grid grid-cols-3 gap-3 mb-7">
                <div className="bg-[#057A55]/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[#057A55]">{stats.correct}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Правильно</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-500">{stats.incorrect}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Ошибок</div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-indigo-600">{percent}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">Точность</div>
                </div>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full mb-7 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, background: '#057A55' }} />
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => router.push(`/decks/${deckId}`)}>← К набору</Button>
                <Button variant="primary" onClick={() => {
                  setFinished(false); setCurrentIndex(0); setUserInput('');
                  setRevealedLetters(new Set()); setShowFeedback(false);
                  setStats({ correct: 0, incorrect: 0 }); setHintsRemaining(TOTAL_HINTS);
                  hasNavigated.current = false; loadCards();
                }}>
                  Пройти ещё раз
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ImmersiveShell>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <ImmersiveShell
      backHref={`/decks/${deckId}`}
      title={`${currentIndex + 1} / ${tasks.length}`}
      progress={progress}
      leftBadge={<Badge variant="green">✓ {stats.correct}</Badge>}
      rightBadge={<Badge variant="red">✗ {stats.incorrect}</Badge>}
    >
      <div className="py-6 px-4 max-w-2xl mx-auto">
        {!showFeedback ? (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  {currentTask.lang === 'en' ? 'Послушай и напиши слово на английском:' : 'Переведи на английский и напиши:'}
                </p>
                <button onClick={() => speakCurrent(currentTask)}
                  className="px-8 py-3.5 bg-[#057A55] text-white rounded-xl text-lg font-semibold hover:bg-[#065f46] transition active:scale-95 mb-4">
                  🔊 Воспроизвести
                </button>
                <div className="mb-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    currentTask.lang === 'en' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {currentTask.lang === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
                  </span>
                </div>
                {renderMask(currentTask.answer)}
                <button onClick={useHint} disabled={hintsRemaining <= 0 || allRevealed}
                  className="px-5 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  💡 Подсказка ({hintsRemaining})
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && userInput.trim()) handleSubmit(); }}
                placeholder="Напиши слово на английском..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition mb-3"
                autoFocus />
              <Button variant="primary" fullWidth onClick={handleSubmit} disabled={!userInput.trim()}>
                Ответить
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl shadow-sm p-8 text-center"
            style={{ background: lastCorrect ? 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="text-white">
              <div className="text-5xl mb-4">{lastCorrect ? '✅' : '❌'}</div>
              <h2 className="text-2xl font-bold mb-4">{lastCorrect ? 'Правильно!' : 'Неправильно'}</h2>
              {!lastCorrect && (
                <>
                  <div className="mb-4 bg-white/10 rounded-xl p-3">
                    <p className="text-white/70 text-xs mb-1">Правильный ответ:</p>
                    <p className="text-xl font-bold">{currentTask.answer}</p>
                  </div>
                  <div className="mb-4 bg-white/10 rounded-xl p-3">
                    <p className="text-white/70 text-xs mb-1">Ты написал:</p>
                    <p className="text-lg">{userInput}</p>
                  </div>
                </>
              )}
              <button onClick={handleNext}
                className="mt-2 px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold text-base transition">
                {currentIndex < tasks.length - 1 ? 'Далее →' : 'Завершить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ImmersiveShell>
  );
}
