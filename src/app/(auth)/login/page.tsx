'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const IS_DEV = process.env.NODE_ENV === 'development';

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
      if (IS_DEV) console.log('🔐 Login: Attempting sign in...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      if (IS_DEV) console.log('✅ Login: Sign in successful');

      // Получить роль пользователя из profiles с повтором
      let profile = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!profile && attempts < maxAttempts) {
        attempts++;
        if (IS_DEV) console.log(`📋 Login: Loading profile (attempt ${attempts}/${maxAttempts})...`);
        
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            // Игнорировать AbortError и повторить
            if (profileError.message?.includes('AbortError')) {
              if (IS_DEV) console.log('⏭️ Login: AbortError, retrying...');
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            
            // Если профиль не найден
            if (profileError.code === 'PGRST116' || profileError.message?.includes('no rows')) {
              console.error('❌ Login: Profile not found');
              router.push('/onboarding');
              return;
            }
            
            // Другая ошибка
            throw profileError;
          }

          profile = profileData;
          if (IS_DEV) console.log('✅ Login: Profile loaded:', profile.role);
        } catch (err: any) {
          if (attempts >= maxAttempts) {
            throw err;
          }
          if (IS_DEV) console.warn(`⚠️ Login: Error on attempt ${attempts}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!profile) {
        throw new Error('Не удалось загрузить профиль. Попробуйте еще раз.');
      }

      // Редирект в зависимости от роли
      if (IS_DEV) console.log('🚀 Login: Redirecting to', profile.role === 'admin' ? 'admin' : 'student');
      if (profile.role === 'admin') {
        router.push('/admin/decks');
      } else {
        router.push('/student/decks');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
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
