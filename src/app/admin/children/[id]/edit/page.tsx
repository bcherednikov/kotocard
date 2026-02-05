'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditChildPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  
  const childId = params.id as string;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRussianTranscription, setShowRussianTranscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (childId && profile) {
      loadChild();
    }
  }, [childId, profile]);

  async function loadChild() {
    try {
      if (!profile) return;

      // Получить token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Сессия не найдена');

      // Вызвать API для получения данных ребёнка
      const response = await fetch('/api/get-children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyId: profile.family_id,
          childId: childId,
          parentToken: session.access_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка загрузки');
      }

      const child = result.children?.[0];
      if (!child) throw new Error('Ребёнок не найден');

      setName(child.display_name);
      setEmail(child.email);
      setShowRussianTranscription(child.show_russian_transcription || false);
    } catch (err) {
      console.error('Ошибка загрузки ребёнка:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!profile) {
        throw new Error('Профиль не загружен');
      }


      // Получить token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Сессия не найдена');

      // Вызвать API для обновления
      const response = await fetch('/api/update-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          name,
          email,
          password: password || undefined, // Отправить только если заполнен
          showRussianTranscription,
          parentToken: session.access_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка обновления');
      }


      // Редирект на список детей
      router.push('/admin/children');
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Хлебные крошки */}
        <div className="mb-6">
          <Link
            href="/admin/children"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к детям
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Редактировать профиль
          </h1>
          <p className="text-gray-700">
            Измените данные ребёнка
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Имя */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Имя ребёнка *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                required
                disabled={saving}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email для входа *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                required
                disabled={saving}
              />
            </div>

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Новый пароль (необязательно)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Оставьте пустым чтобы не менять"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={saving}
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-700">
                Минимум 6 символов. Оставьте пустым если не хотите менять пароль.
              </p>
            </div>

            {/* Русская транскрипция */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  id="show_transcription"
                  type="checkbox"
                  checked={showRussianTranscription}
                  onChange={(e) => setShowRussianTranscription(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={saving}
                />
                <label htmlFor="show_transcription" className="ml-3 flex-1">
                  <span className="block text-sm font-medium text-gray-900">
                    📖 Показывать русскую транскрипцию
                  </span>
                  <span className="block text-xs text-gray-700 mt-1">
                    При обучении под английскими словами будет показана русская транскрипция (например: apple → эпл, one → уан)
                  </span>
                </label>
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-4">
              <Link
                href="/admin/children"
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
