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

  const progressColor = isPerfect ? '#f59e0b' : isGood ? '#057A55' : '#ef4444';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F5F0' }}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-6xl mb-5">
            {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isPerfect ? 'Идеально!' : isGood ? 'Отлично!' : 'Хорошая работа!'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">Повторение завершено!</p>

          <div className="grid grid-cols-3 gap-3 mb-7">
            <div className="bg-[#057A55]/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-[#057A55]">{correct}</div>
              <div className="text-xs text-gray-400 mt-0.5">Правильно</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-500">{incorrect}</div>
              <div className="text-xs text-gray-400 mt-0.5">Ошибки</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-700">{total}</div>
              <div className="text-xs text-gray-400 mt-0.5">Всего</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-black mb-2" style={{ color: progressColor }}>{percentage}%</div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%`, background: progressColor }} />
            </div>
          </div>

          {!isGood && (
            <p className="text-gray-400 text-xs mb-6">
              Ошибочные карточки вернулись в режим изучения. Повтори их позже!
            </p>
          )}

          <div className="flex gap-3">
            <Link href="/review/start"
              className="flex-1 py-3 text-white rounded-xl font-semibold text-sm transition shadow-sm text-center"
              style={{ background: '#057A55' }}>
              Повторить ещё
            </Link>
            <Link href="/dashboard"
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition text-center">
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    }>
      <ReviewCompleteContent />
    </Suspense>
  );
}
