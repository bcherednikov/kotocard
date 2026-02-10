'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewGroupPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deckAddPermission, setDeckAddPermission] = useState('admin_only');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          deck_add_permission: deckAddPermission,
          userId: profile.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания группы');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/groups" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Назад к группам
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Создать группу</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Название группы *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Семья Ивановых"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                Описание
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Необязательно"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Кто может добавлять наборы в группу?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition border-gray-300">
                  <input
                    type="radio"
                    name="permission"
                    value="admin_only"
                    checked={deckAddPermission === 'admin_only'}
                    onChange={(e) => setDeckAddPermission(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Только админы</div>
                    <div className="text-sm text-gray-600">Подходит для семей и классов</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition border-gray-300">
                  <input
                    type="radio"
                    name="permission"
                    value="all_members"
                    checked={deckAddPermission === 'all_members'}
                    onChange={(e) => setDeckAddPermission(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Все участники</div>
                    <div className="text-sm text-gray-600">Для совместного обучения</div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/groups"
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Создаём...' : 'Создать группу'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
