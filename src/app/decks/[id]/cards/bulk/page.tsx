'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function BulkCreateCardsPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params?.id as string;

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; errors?: any[] } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!text.trim()) { setError('Введите слова для перевода'); return; }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Не авторизован'); return; }

      const response = await fetch('/api/bulk-create-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId, text: text.trim(), parentToken: session.access_token }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка создания карточек');

      setResult(data);
      setTimeout(() => { router.push(`/decks/${deckId}`); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания карточек');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Массовое создание карточек</h1>
          <p className="text-gray-700">
            Введите слова (по одному на строку), система автоматически определит язык и переведёт их
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-semibold text-gray-800 mb-2">
              Слова для перевода (по одному на строку)
            </label>
            <textarea
              id="text" value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"Яблоко\nБанан\nГруша\n\nили\n\nApple\nBanana\nPear"}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono"
              rows={12} disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-600">
              Система автоматически определит язык (русский или английский) и переведёт слова
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Создано карточек: {result.created}</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-orange-700 font-medium">Ошибки:</p>
                  <ul className="list-disc list-inside text-orange-600 text-sm mt-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err.word}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-gray-600 text-sm mt-2">Возвращаемся к набору...</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading || !!result}
              className="flex-1 bg-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
              {loading ? 'Создаём карточки...' : 'Создать карточки'}
            </button>
            <button type="button" onClick={() => router.push(`/decks/${deckId}`)} disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all active:scale-95">
              Отмена
            </button>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📖 Как использовать:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
            <li>Введите слова по одному на строку</li>
            <li>Можно вводить на русском или английском</li>
            <li>Система сама определит язык и переведёт</li>
            <li>Карточки создадутся автоматически</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
