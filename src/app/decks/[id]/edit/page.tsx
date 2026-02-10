'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;
  const { profile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile && deckId) loadDeck();
  }, [profile, deckId]);

  async function loadDeck() {
    try {
      const { data, error: fetchError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('id', deckId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) { setError('Набор не найден'); return; }

      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '');
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить набор');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const tags = tagsInput.split(/[,\s]+/).map(t => t.trim()).filter(t => t.length > 0);

      const { error: updateError } = await supabase
        .from('decks')
        .update({ name: name.trim(), description: description.trim() || null, tags, updated_at: new Date().toISOString() })
        .eq('id', deckId);

      if (updateError) throw updateError;
      router.push(`/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
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

  if (error && !name) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">&#10060;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Набор не найден</h1>
        <Link href="/decks" className="text-blue-600 hover:text-blue-800 font-medium">← Вернуться к наборам</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/decks/${deckId}`} className="text-blue-600 hover:text-blue-800 font-medium">
            ← Назад к набору
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Редактировать набор</h1>
          <p className="text-gray-700">Измените название, описание или теги</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">Название набора *</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Например: Английские слова для детей"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                required disabled={saving} />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">Описание</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание набора (необязательно)" rows={4}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={saving} />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-2">Теги</label>
              <input id="tags" type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                placeholder="английский, начинающий, дети (через запятую)"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={saving} />
              <p className="mt-1 text-xs text-gray-700">Введите теги через запятую или пробел</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link href={`/decks/${deckId}`}
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                Отмена
              </Link>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
