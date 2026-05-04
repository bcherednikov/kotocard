'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

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
    <div className="min-h-screen" style={{ background: '#F7F5F0' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/decks/${deckId}`} className="inline-flex items-center gap-1.5 text-[#057A55] hover:text-[#065f46] font-medium text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Назад к набору
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Массовое добавление</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Введите слова по одному на строку — система переведёт автоматически
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1.5">
              Слова для перевода (по одному на строку)
            </label>
            <textarea
              id="text" value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"Яблоко\nБанан\nГруша\n\nили\n\nApple\nBanana\nPear"}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition font-mono text-sm"
              rows={12} disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-400">
              Система определит язык (русский или английский) и переведёт
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-3 bg-[#057A55]/5 border border-[#057A55]/20 rounded-xl">
              <p className="text-sm text-[#057A55] font-medium">Создано карточек: {result.created}</p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-600 font-medium mb-1">Ошибки:</p>
                  <ul className="list-disc list-inside text-amber-600 text-xs space-y-0.5">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err.word}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Возвращаемся к набору...</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading || !!result}
              className="flex-1 bg-[#057A55] text-white py-2.5 px-6 rounded-xl text-sm font-semibold hover:bg-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95">
              {loading ? 'Создаём карточки...' : 'Создать карточки'}
            </button>
            <button type="button" onClick={() => router.push(`/decks/${deckId}`)} disabled={loading}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 transition">
              Отмена
            </button>
          </div>
        </form>

        <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Как использовать</h3>
          <ol className="list-decimal list-inside text-gray-500 space-y-1 text-sm">
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
