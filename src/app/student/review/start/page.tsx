'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ReviewStartPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔄</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Режим повторения
          </h1>
          <p className="text-xl text-gray-700">
            50 случайных карточек из всех твоих изученных наборов
          </p>
        </div>

        {/* Выбор направления */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Выбери направление обучения:
          </h2>
          
          <div className="grid gap-4">
            <Link
              href="/student/review?direction=ru_to_en"
              className="block p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🇷🇺</div>
                <div className="text-4xl">→</div>
                <div className="text-4xl">🇬🇧</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Русский → Английский</h3>
                  <p className="text-gray-700">Показываем русское слово, переводишь на английский</p>
                </div>
              </div>
            </Link>

            <Link
              href="/student/review?direction=en_to_ru"
              className="block p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🇬🇧</div>
                <div className="text-4xl">→</div>
                <div className="text-4xl">🇷🇺</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Английский → Русский</h3>
                  <p className="text-gray-700">Показываем английское слово, переводишь на русский</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Информация */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-purple-900 mb-3">💡 Как это работает:</h3>
          <ul className="space-y-2 text-purple-800">
            <li>🎲 Выбираются 50 случайных карточек из всех изученных наборов</li>
            <li>🔄 Можно повторять слова из разных тем вместе</li>
            <li>📊 Прогресс сохраняется как обычно</li>
            <li>🎯 Отличный способ закрепить знания!</li>
          </ul>
        </div>

        {/* Назад */}
        <div className="text-center mt-6">
          <Link
            href="/student/decks"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>
      </div>
    </div>
  );
}
