'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [ruText, setRuText] = useState('');
  const [enText, setEnText] = useState('');
  const [ruTranscription, setRuTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const deckId = params.id as string;
  const cardId = params.cardId as string;

  useEffect(() => {
    loadCard();
  }, [cardId]);

  async function loadCard() {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;

      setRuText(data.ru_text);
      setEnText(data.en_text);
      setRuTranscription(data.ru_transcription || '');
      setAudioUrl(data.audio_url || '');
    } catch (err) {
      console.error('Ошибка загрузки карточки:', err);
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
        .update({
          ru_text: ruText,
          en_text: enText,
          ru_transcription: ruTranscription || null,
          audio_url: audioUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (updateError) throw updateError;


      // Редирект обратно к набору
      router.push(`/admin/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления карточки');
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
            href={`/admin/decks/${deckId}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Назад к набору
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Редактировать карточку
          </h1>
          <p className="text-gray-700">
            Измените текст на русском или английском
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Русский текст */}
            <div>
              <label htmlFor="ruText" className="block text-sm font-medium text-gray-900 mb-2">
                🇷🇺 Текст на русском *
              </label>
              <input
                id="ruText"
                type="text"
                value={ruText}
                onChange={(e) => setRuText(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                required
                disabled={saving}
              />
            </div>

            {/* Английский текст */}
            <div>
              <label htmlFor="enText" className="block text-sm font-medium text-gray-900 mb-2">
                🇬🇧 Текст на английском *
              </label>
              <input
                id="enText"
                type="text"
                value={enText}
                onChange={(e) => setEnText(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                required
                disabled={saving}
              />
            </div>

            {/* Русская транскрипция */}
            <div>
              <label htmlFor="ruTranscription" className="block text-sm font-medium text-gray-900 mb-2">
                📖 Русская транскрипция (необязательно)
              </label>
              <input
                id="ruTranscription"
                type="text"
                value={ruTranscription}
                onChange={(e) => setRuTranscription(e.target.value)}
                placeholder="Например: эпл"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={saving}
              />
              <p className="mt-1 text-xs text-gray-700">
                Фонетическая транскрипция русскими буквами для детей с трудностями в чтении
              </p>
            </div>

            {/* Audio URL */}
            <div>
              <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-900 mb-2">
                🔊 Ссылка на аудио (необязательно)
              </label>
              <input
                id="audioUrl"
                type="url"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                disabled={saving}
              />
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
                href={`/admin/decks/${deckId}`}
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
