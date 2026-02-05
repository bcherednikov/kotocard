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
          {/* История результатов */}
          <Link
            href="/student/test/history"
            className="block bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-start gap-6">
              <div className="text-5xl">📊</div>
              <div className="flex-1 text-white">
                <h2 className="text-2xl font-bold mb-2">
                  Твои результаты
                </h2>
                <p className="mb-4 text-green-50">
                  История всех пройденных проверок, статистика и прогресс
                </p>
                <div className="text-3xl">→</div>
              </div>
            </div>
          </Link>

          {/* Случайный микс */}
          <Link
            href="/student/test/random-mix"
            className="block bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="flex items-start gap-6">
              <div className="text-5xl">🎲</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Случайный микс
                </h2>
                <p className="text-gray-700 mb-4">
                  10 случайных вопросов из всех изученных слов. 
                  Разные типы заданий: выбор варианта, диктант, аудио.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    📝 Текст
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    🔊 Аудио
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    ✍️ Диктант
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    ✅ Выбор
                  </span>
                </div>
              </div>
              <div className="text-3xl text-gray-400">→</div>
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
