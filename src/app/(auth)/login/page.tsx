'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      let profile = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!profile && attempts < maxAttempts) {
        attempts++;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            if (profileError.message?.includes('AbortError')) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            if (profileError.code === 'PGRST116' || profileError.message?.includes('no rows')) {
              setError('Профиль не найден. Обратитесь к администратору.');
              setLoading(false);
              return;
            }
            if (attempts >= maxAttempts) throw profileError;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          profile = profileData;
        } catch (err: any) {
          if (attempts >= maxAttempts) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!profile) {
        throw new Error('Не удалось загрузить профиль. Попробуйте еще раз.');
      }

      const redirectPath = profile.role === 'admin' ? '/admin/decks' : '/student';
      setLoading(false);
      setTimeout(() => router.push(redirectPath), 100);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📚</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход</h1>
        <p className="text-gray-800">Войдите в свой аккаунт</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
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
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-800">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
