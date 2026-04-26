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
        .from('user_cards').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).neq('status', 'new');
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#F7F5F0' }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#057A55]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Режим повторения</h1>
          <p className="text-gray-500 text-sm">Повтори выученные карточки из всех наборов</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-4 text-center">
          {reviewCount > 0 ? (
            <>
              <div className="text-5xl font-black text-gray-900 mb-1">{reviewCount}</div>
              <p className="text-gray-500 text-sm mb-6">изученных карточек</p>
              <Link href="/review/start"
                className="inline-block px-8 py-3 text-white rounded-xl font-semibold text-sm transition shadow-sm"
                style={{ background: '#057A55' }}>
                Начать повторение →
              </Link>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">😕</div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Нет изученных карточек</h2>
              <p className="text-gray-500 text-sm">Сначала изучи карточки в наборах и отметь «Знаю»</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Как это работает</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>📖 Сначала просмотри карточки и отметь «Знаю»</li>
            <li>🎯 Пройди 3 теста: выбор, аудио, диктант</li>
            <li>🔄 Выученные слова появляются для повторения по расписанию</li>
            <li>📈 Чем лучше помнишь, тем реже повторяешь!</li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Назад на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
