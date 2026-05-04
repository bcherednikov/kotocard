'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const [ruText, setRuText] = useState('');
  const [enText, setEnText] = useState('');
  const [ruTranscription, setRuTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const deckId = params.id as string;
  const cardId = params.cardId as string;

  useEffect(() => { loadCard(); }, [cardId]);

  async function loadCard() {
    try {
      const { data, error } = await supabase.from('cards').select('*').eq('id', cardId).single();
      if (error) throw error;
      setRuText(data.ru_text);
      setEnText(data.en_text);
      setRuTranscription(data.ru_transcription || '');
      setAudioUrl(data.audio_url || '');
    } catch {
      setError('Карточка не найдена');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ ru_text: ruText, en_text: enText, ru_transcription: ruTranscription || null, audio_url: audioUrl || null, updated_at: new Date().toISOString() })
        .eq('id', cardId);
      if (updateError) throw updateError;
      router.push(`/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления карточки');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Редактировать карточку</h1>
          <p className="text-gray-500 text-sm mt-0.5">Измените текст на русском или английском</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label htmlFor="ruText" className="block text-sm font-medium text-gray-700 mb-1.5">🇷🇺 Текст на русском *</label>
            <input id="ruText" type="text" value={ruText} onChange={(e) => setRuText(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 text-sm"
              required disabled={saving} />
          </div>

          <div>
            <label htmlFor="enText" className="block text-sm font-medium text-gray-700 mb-1.5">🇬🇧 Текст на английском *</label>
            <input id="enText" type="text" value={enText} onChange={(e) => setEnText(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 text-sm"
              required disabled={saving} />
          </div>

          <div>
            <label htmlFor="ruTranscription" className="block text-sm font-medium text-gray-700 mb-1.5">📖 Транскрипция (необязательно)</label>
            <input id="ruTranscription" type="text" value={ruTranscription} onChange={(e) => setRuTranscription(e.target.value)}
              placeholder="Например: эпл"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              disabled={saving} />
          </div>

          <div>
            <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 mb-1.5">🔊 Ссылка на аудио (необязательно)</label>
            <input id="audioUrl" type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#057A55] focus:border-[#057A55] outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
              disabled={saving} />
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
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#057A55] text-white rounded-xl text-sm font-semibold hover:bg-[#065f46] transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
