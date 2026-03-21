'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ReviewLandingPage() {
  const { profile } = useAuth();
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) loadCount();
  }, [profile]);

  async function loadCount() {
    if (!profile) return;
    try {
      const { count, error } = await supabase
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .neq('status', 'new');
      if (error) throw error;
      setReviewCount(count ?? 0);
    } catch (err) {
      console.error('Error loading review count:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!profile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔄</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Режим повторения</h1>
          <p className="text-xl text-gray-700">Повтори выученные карточки из всех наборов</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          {reviewCount > 0 ? (
            <>
              <div className="text-6xl font-bold text-orange-600 mb-4">{reviewCount}</div>
              <p className="text-xl text-gray-700 mb-6">изученных карточек</p>
              <Link
                href="/review/start"
                className="inline-block px-8 py-4 bg-orange-500 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-xl hover:from-orange-600 hover:to-red-700 transition shadow-lg"
              >
                Начать повторение
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😕</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Нет изученных карточек</h2>
              <p className="text-gray-700">Сначала изучи карточки в наборах и отметь «Знаю»</p>
            </>
          )}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-purple-900 mb-3">💡 Как это работает:</h3>
          <ul className="space-y-2 text-purple-800">
            <li>📖 Сначала просмотри карточки и отметь «Знаю»</li>
            <li>🎯 Пройди 3 теста: выбор, аудио, диктант</li>
            <li>🔄 Выученные слова появляются для повторения по расписанию</li>
            <li>📈 Чем лучше помнишь, тем реже повторяешь!</li>
          </ul>
        </div>

        <div className="text-center mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Назад на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
