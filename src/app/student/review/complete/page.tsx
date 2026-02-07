'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ReviewCompleteContent() {
  const searchParams = useSearchParams();

  const correct = parseInt(searchParams.get('correct') || '0');
  const incorrect = parseInt(searchParams.get('incorrect') || '0');
  const total = parseInt(searchParams.get('total') || '0') || (correct + incorrect);

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = correct === total && total > 0;
  const isGood = percentage >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="text-8xl mb-6">
            {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isPerfect ? 'Идеально!' : isGood ? 'Отлично!' : 'Хорошая работа!'}
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Повторение завершено!
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div>
              <div className="text-5xl font-bold text-green-600">{correct}</div>
              <div className="text-gray-700">Правильно</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div>
              <div className="text-5xl font-bold text-red-600">{incorrect}</div>
              <div className="text-gray-700">Ошибки</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div>
              <div className="text-5xl font-bold text-gray-800">{total}</div>
              <div className="text-gray-700">Всего</div>
            </div>
          </div>

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

          {!isGood && (
            <p className="text-gray-600 mb-6">
              Ошибочные карточки вернулись в режим изучения. Повтори их позже!
            </p>
          )}

          <div className="flex gap-4">
            <Link
              href="/student/review"
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-teal-700 transition shadow-lg"
            >
              Повторить ещё
            </Link>
            <Link
              href="/student"
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    }>
      <ReviewCompleteContent />
    </Suspense>
  );
}
