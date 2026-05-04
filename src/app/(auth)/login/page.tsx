'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, isInitialized, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Если уже залогинен - редирект
  useEffect(() => {
    if (isInitialized && !isLoading && user && profile) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isLoading, user, profile, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // AuthContext сам загрузит профиль и установит isInitialized
      // Редирект произойдёт через useEffect выше когда профиль загрузится
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#057A55] flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-xl font-black">К</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Вход</h1>
        <p className="text-gray-500 text-sm">Войдите в свой аккаунт</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />

        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          minLength={6}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-[#057A55] font-semibold hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
