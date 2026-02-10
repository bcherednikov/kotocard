'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDeckPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!profile) {
        throw new Error('Профиль не загружен');
      }

      const tags = tagsInput
        .split(/[,\s]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const insertData = {
        name,
        description: description || null,
        tags,
        owner_id: profile.id,
      };

      const { data, error: insertError } = await supabase
        .from('decks')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/decks/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания набора');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/decks"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к наборам
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Создать новый набор
          </h1>
          <p className="text-gray-700">
            Заполните информацию о наборе карточек
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Название набора *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Английские слова для детей"
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
                placeholder="Краткое описание набора (необязательно)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-2">
                Теги
              </label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="английский, начинающий, дети (через запятую)"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-700">
                Введите теги через запятую или пробел
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/decks"
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создаём...' : 'Создать набор'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
