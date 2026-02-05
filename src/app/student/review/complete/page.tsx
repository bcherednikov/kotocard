'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ReviewCompleteContent() {
  const searchParams = useSearchParams();

  const correct = parseInt(searchParams.get('correct') || '0');
  const incorrect = parseInt(searchParams.get('incorrect') || '0');
  const total = parseInt(searchParams.get('total') || '50');

  const percentage = Math.round((correct / total) * 100);
  const isPerfect = correct === total;
  const isGood = percentage >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Результат */}
          <div className="text-8xl mb-6">
            {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isPerfect ? 'Идеально!' : isGood ? 'Отлично!' : 'Хорошая работа!'}
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Ты завершил режим повторения!
          </p>

          {/* Статистика */}
          <div className="flex justify-center gap-8 mb-8">
            <div>
              <div className="text-5xl font-bold text-green-600">{correct}</div>
              <div className="text-gray-700">Знаю</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div>
              <div className="text-5xl font-bold text-red-600">{incorrect}</div>
              <div className="text-gray-700">Не знаю</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div>
              <div className="text-5xl font-bold text-gray-800">{total}</div>
              <div className="text-gray-700">Всего</div>
            </div>
          </div>

          {/* Прогресс бар */}
          <div className="mb-8">
            <div className="text-3xl font-bold text-purple-600 mb-2">{percentage}%</div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isPerfect ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  isGood ? 'bg-gradient-to-r from-blue-400 to-purple-600' :
                  'bg-gradient-to-r from-orange-400 to-red-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <Link
              href="/student/review/start"
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
            >
              Повторить ещё раз
            </Link>
            <Link
              href="/student/decks"
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
            >
              К наборам
            </Link>
          </div>
        </div>

        {/* Мотивация */}
        {percentage < 100 && (
          <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-orange-800">
              💡 Повтори ещё раз, чтобы улучшить результат!
            </p>
          </div>
        )}

        {isPerfect && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-semibold">
              🌟 Невероятно! Ты знаешь все слова идеально!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    }>
      <ReviewCompleteContent />
    </Suspense>
  );
}
