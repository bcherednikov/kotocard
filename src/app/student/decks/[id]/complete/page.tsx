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

    // Показать конфетти если хороший результат
    const total = correctCount + incorrectCount;
    const percentage = total > 0 ? (correctCount / total) * 100 : 0;
    
    if (percentage >= 70) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [searchParams]);

  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Определить эмодзи и сообщение по результату
  let emoji = '👍';
  let message = 'Хорошая работа!';
  let color = 'from-blue-500 to-purple-600';

  if (percentage >= 90) {
    emoji = '🏆';
    message = 'Отлично! Ты молодец!';
    color = 'from-yellow-400 to-orange-500';
  } else if (percentage >= 70) {
    emoji = '🌟';
    message = 'Очень хорошо!';
    color = 'from-green-500 to-blue-500';
  } else if (percentage >= 50) {
    emoji = '👍';
    message = 'Неплохо! Продолжай учить!';
    color = 'from-blue-500 to-purple-600';
  } else {
    emoji = '💪';
    message = 'Ничего страшного! Попробуй ещё раз!';
    color = 'from-purple-500 to-pink-600';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '⭐', '🌟', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-2xl p-12 mb-8 text-white text-center`}>
          <div className="text-8xl mb-6">{emoji}</div>
          <h1 className="text-4xl font-bold mb-4">
            {message}
          </h1>
          <p className="text-2xl mb-8">
            Сессия завершена!
          </p>

          {/* Прогресс круг */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-white/30"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
                className="text-white transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-5xl font-bold">{percentage}%</div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Результаты
          </h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {total}
              </div>
              <div className="text-sm text-gray-600">Всего карточек</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {correct}
              </div>
              <div className="text-sm text-gray-600">Правильно ✓</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">
                {incorrect}
              </div>
              <div className="text-sm text-gray-600">Неправильно ✗</div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/student/decks/${deckId}`}
            className="py-4 bg-white text-center rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-lg text-gray-700"
          >
            ← Назад к набору
          </Link>
          <Link
            href={`/student/decks/${deckId}/study${window.location.search}`}
            className="py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
          >
            Повторить →
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/student/decks"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Вернуться ко всем наборам
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    }>
      <CompletePageContent />
    </Suspense>
  );
}
