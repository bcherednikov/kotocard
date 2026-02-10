'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { user, isInitialized, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  // Редирект после логина
  useEffect(() => {
    if (waitingForAuth && isInitialized && !isLoading && user) {
      router.replace('/dashboard');
    }
  }, [waitingForAuth, isInitialized, isLoading, user, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Вызвать API для регистрации (БЕЗ автологина!)
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка регистрации');
      }

      // Сразу залогиниться с созданными credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // Если автологин не сработал — редирект на страницу успеха
        localStorage.setItem('registered_email', email);
        router.push('/register/success');
        return;
      }

      // Ставим флаг что ждём загрузку профиля
      // Редирект произойдёт через useEffect когда AuthContext загрузит профиль
      setWaitingForAuth(true);

    } catch (err: any) {
      let errorMessage = err.message || 'Ошибка регистрации';

      if (errorMessage.includes('invalid')) {
        errorMessage = 'Используйте реальный email адрес (не example.com)';
      } else if (errorMessage.includes('already') || errorMessage.includes('зарегистрирован')) {
        errorMessage = 'Этот email уже зарегистрирован. Попробуйте войти.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Регистрация</h1>
        <p className="text-gray-800">Создайте аккаунт для обучения</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-900 mb-2">
            Ваше имя
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
            placeholder="Как вас зовут"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
            placeholder="Минимум 6 символов"
            required
            disabled={loading}
            minLength={6}
          />
          <p className="mt-1 text-xs text-gray-700">Минимум 6 символов</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || waitingForAuth}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || waitingForAuth ? 'Создаём аккаунт...' : 'Создать аккаунт'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-800">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
