'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isInitialized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && user) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isLoading, user, router]);

  // Если авторизован — не показываем лендинг (идёт редирект)
  if (user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Добро пожаловать в KotoCard
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Приложение для изучения английского языка через карточки
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="inline-block px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Создать аккаунт
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Свои наборы</h3>
            <p className="text-gray-700">
              Создавайте наборы карточек и учите слова в своём темпе
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Группы</h3>
            <p className="text-gray-700">
              Делитесь наборами с друзьями и семьёй через группы
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Умное повторение</h3>
            <p className="text-gray-700">
              Система интервального повторения подскажет, что пора повторить
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
