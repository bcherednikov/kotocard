'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function CompletePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deckId = params.id as string;

  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const correctCount = parseInt(searchParams.get('correct') || '0');
    const incorrectCount = parseInt(searchParams.get('incorrect') || '0');
    setCorrect(correctCount);
    setIncorrect(incorrectCount);
    const total = correctCount + incorrectCount;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;
    if (percentage >= 70) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [searchParams]);

  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  let emoji = '👍';
  let message = 'Хорошая работа!';
  if (percentage >= 90) { emoji = '🏆'; message = 'Отлично! Ты молодец!'; }
  else if (percentage >= 70) { emoji = '🌟'; message = 'Очень хорошо!'; }
  else if (percentage < 50) { emoji = '💪'; message = 'Ничего страшного! Попробуй ещё раз!'; }

  const progressColor = percentage >= 90 ? '#f59e0b' : percentage >= 70 ? '#057A55' : percentage >= 50 ? '#6366f1' : '#ef4444';

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: '#F7F5F0' }}>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="absolute animate-fall"
              style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, animationDuration: `${2 + Math.random() * 2}s` }}>
              {['🎉', '⭐', '🌟', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-4 text-center">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{message}</h1>
          <p className="text-gray-500 text-sm mb-7">Сессия завершена</p>

          <div className="relative inline-flex items-center justify-center mb-7">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle cx="64" cy="64" r="54" stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
              <circle cx="64" cy="64" r="54" stroke={progressColor} strokeWidth="10" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-700">{total}</div>
              <div className="text-xs text-gray-400 mt-0.5">Всего</div>
            </div>
            <div className="bg-[#057A55]/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-[#057A55]">{correct}</div>
              <div className="text-xs text-gray-400 mt-0.5">Правильно</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-500">{incorrect}</div>
              <div className="text-xs text-gray-400 mt-0.5">Ошибки</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link href={`/decks/${deckId}`}
            className="py-3 bg-white border border-gray-200 text-center rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
            ← К набору
          </Link>
          <Link href={`/decks/${deckId}/study`}
            className="py-3 text-white text-center rounded-xl text-sm font-semibold transition shadow-sm"
            style={{ background: '#057A55' }}>
            Повторить →
          </Link>
        </div>

        <div className="text-center">
          <Link href="/decks" className="text-gray-400 hover:text-gray-600 text-sm">
            Вернуться ко всем наборам
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall { to { transform: translateY(100vh) rotate(360deg); } }
        .animate-fall { animation: fall linear forwards; }
      `}</style>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    }>
      <CompletePageContent />
    </Suspense>
  );
}
