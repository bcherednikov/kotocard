'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type ChildInput = {
  name: string;
  email: string;
  password: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<ChildInput[]>([
    { name: '', email: '', password: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addChild() {
    setChildren([...children, { name: '', email: '', password: '' }]);
  }

  function removeChild(index: number) {
    if (children.length === 1) return;
    const updated = children.filter((_, i) => i !== index);
    setChildren(updated);
  }

  function updateChild(index: number, field: keyof ChildInput, value: string) {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user || !profile) {
        throw new Error('Вы не авторизованы. Пожалуйста войдите в систему.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Сессия не найдена. Пожалуйста войдите заново.');
      }

      const response = await fetch('/api/create-children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          children: children.filter(c => c.name.trim()),
          familyId: profile.family_id,
          parentToken: session.access_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания детей');
      }

      router.push('/admin/decks');

    } catch (err: any) {
      setError(err.message || 'Ошибка создания детей');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    router.push('/admin/children');
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Добавьте детей</h1>
          <p className="text-lg text-gray-800">
            Создайте учётные записи для ваших детей, чтобы они могли учиться
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {children.map((child, index) => (
            <div key={index} className="bg-white p-6 border-2 border-gray-300 rounded-xl space-y-4 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-xl text-gray-900">Ребёнок {index + 1}</h3>
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Удалить
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Имя ребёнка
                </label>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(index, 'name', e.target.value)}
                  placeholder="Например: Петя"
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email для входа
                </label>
                <input
                  type="email"
                  value={child.email}
                  onChange={(e) => updateChild(index, 'email', e.target.value)}
                  placeholder="petya@family.local или petya@gmail.com"
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-700">
                  Ребёнок будет входить используя этот email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  value={child.password}
                  onChange={(e) => updateChild(index, 'password', e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-700">
                  Придумайте простой пароль который ребёнок запомнит
                </p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addChild}
            className="w-full py-3 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            + Добавить ещё ребёнка
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSkip}
              className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Пропустить
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Создаём профили...' : 'Продолжить'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Совет:</strong> Используйте простые email'ы типа <code className="bg-white px-2 py-1 rounded">petya@family.local</code>
            и лёгкие пароли которые дети смогут запомнить.
          </p>
        </div>
      </div>
    </div>
  );
}
