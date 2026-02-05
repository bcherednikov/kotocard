'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function TestModesPage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Проверка знаний
          </h1>
          <p className="text-xl text-gray-700">
            Проверь насколько хорошо ты выучил слова!
          </p>
        </div>

        {/* Режимы тестов */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Случайный микс */}
          <Link
            href="/student/test/random-mix"
            className="block bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-white">
              <div className="text-5xl mb-4">🎲</div>
              <h2 className="text-2xl font-bold mb-3">
                Случайный микс
              </h2>
              <p className="text-purple-100 mb-4">
                10 случайных вопросов из всех изученных слов
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  📝 Текст
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  🔊 Аудио
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  ✍️ Диктант
                </span>
              </div>
            </div>
          </Link>

          {/* По теме */}
          <Link
            href="/student/test/by-deck"
            className="block bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-white">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-3">
                По теме
              </h2>
              <p className="text-blue-100 mb-4">
                Выбери набор и проверь знания по конкретной теме
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  🎯 Целевая проверка
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full">
                  📖 По набору
                </span>
              </div>
            </div>
          </Link>

        </div>

        {/* Инструкция */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">📖 Как это работает:</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✅ Тестируются только те слова, которые ты уже учил</li>
            <li>🎲 Вопросы и типы заданий выбираются случайно</li>
            <li>📊 Сразу видишь правильно ли ответил</li>
            <li>🏆 В конце получишь результат и статистику</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
