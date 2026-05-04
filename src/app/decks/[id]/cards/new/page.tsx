'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchUnsplashUrl } from '@/lib/unsplash';

export default function NewCardPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [deckName, setDeckName] = useState('');
  const [ruText, setRuText] = useState('');
  const [enText, setEnText] = useState('');
  const [ruTranscription, setRuTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deckId = params.id as string;

  useEffect(() => { loadDeckName(); }, [deckId]);

  async function loadDeckName() {
    try {
      const { data } = await supabase.from('decks').select('name').eq('id', deckId).single();
      if (data) setDeckName(data.name);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!profile) throw new Error('Профиль не загружен');

      const { data: maxData, error: maxError } = await supabase
        .from('cards').select('position').eq('deck_id', deckId)
        .order('position', { ascending: false }).limit(1).maybeSingle();

      if (maxError && maxError.code !== 'PGRST116') throw maxError;

      const nextPosition = maxData ? maxData.position + 1 : 0;

      const { data, error: insertError } = await supabase
        .from('cards')
        .insert({ deck_id: deckId, ru_text: ruText, en_text: enText, ru_transcription: ruTranscription || null, audio_url: audioUrl || null, position: nextPosition })
        .select().single();

      if (insertError) throw insertError;

      try {
        const imageUrl = await fetchUnsplashUrl(enText);
        if (imageUrl && data?.id) {
          await supabase.from('cards').update({ image_url: imageUrl }).eq('id', data.id);
        }
      } catch {}

      router.push(`/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания карточки');
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
            Назад к набору {deckName && `"${deckName}"`}
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Добавить карточку</h1>
          <p className="text-gray-500 text-sm mt-0.5">Введите текст на русском и английском</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label htmlFor="ruText" className="block text-sm font-medium text-gray-700 mb-1.5">🇷🇺 Текст на русском *</label>
            <input id="ruText" type="text" value={ruText} onChange={(e) => setRuText(e.target.value)}
              placeholder="Например: Яблоко"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              required disabled={loading} />
          </div>

          <div>
            <label htmlFor="enText" className="block text-sm font-medium text-gray-700 mb-1.5">🇬🇧 Текст на английском *</label>
            <input id="enText" type="text" value={enText} onChange={(e) => setEnText(e.target.value)}
              placeholder="Например: Apple"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              required disabled={loading} />
          </div>

          <div>
            <label htmlFor="ruTranscription" className="block text-sm font-medium text-gray-700 mb-1.5">📖 Транскрипция (необязательно)</label>
            <input id="ruTranscription" type="text" value={ruTranscription} onChange={(e) => setRuTranscription(e.target.value)}
              placeholder="Например: эпл"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              disabled={loading} />
            <p className="mt-1 text-xs text-gray-400">Фонетическая транскрипция русскими буквами</p>
          </div>

          <div>
            <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-1.5">🔊 Ссылка на аудио (необязательно)</label>
            <input id="audioUrl" type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              disabled={loading} />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Link href={`/decks/${deckId}`}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Отмена
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-[#057A55] text-white rounded-xl text-sm font-semibold hover:bg-[#065f46] transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Создаём...' : 'Добавить карточку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
