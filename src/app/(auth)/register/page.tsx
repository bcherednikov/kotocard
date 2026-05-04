'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#057A55] flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-xl font-black">К</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Регистрация</h1>
        <p className="text-gray-500 text-sm">Создайте аккаунт для обучения</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Ваше имя"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Как вас зовут"
          required
          disabled={loading}
        />

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
          placeholder="Минимум 6 символов"
          helper="Минимум 6 символов"
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
          loading={loading || waitingForAuth}
          disabled={loading || waitingForAuth}
        >
          {loading || waitingForAuth ? 'Создаём аккаунт...' : 'Создать аккаунт'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-[#057A55] font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
