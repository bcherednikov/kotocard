'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCardPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [deckName, setDeckName] = useState('');
  const [ruText, setRuText] = useState('');
  const [enText, setEnText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deckId = params.id as string;

  useEffect(() => {
    loadDeckName();
  }, [deckId]);

  async function loadDeckName() {
    try {
      const { data } = await supabase
        .from('decks')
        .select('name')
        .eq('id', deckId)
        .single();

      if (data) setDeckName(data.name);
    } catch (err) {
      console.error('Ошибка загрузки набора:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!profile) {
        throw new Error('Профиль не загружен');
      }

      console.log('🚀 [1/3] Создаём карточку:', { ruText, enText, audioUrl });

      // Получить максимальную позицию
      console.log('📋 [2/3] Получаем максимальную позицию...');
      const { data: maxData, error: maxError } = await supabase
        .from('cards')
        .select('position')
        .eq('deck_id', deckId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle(); // используем maybeSingle вместо single (не вызовет ошибку если нет результатов)

      if (maxError && maxError.code !== 'PGRST116') {
        console.error('❌ Ошибка получения позиции:', maxError);
        throw maxError;
      }

      const nextPosition = maxData ? maxData.position + 1 : 0;
      console.log('✅ [2/3] Следующая позиция:', nextPosition);

      console.log('💾 [3/3] Вставляем карточку в БД...');
      const { data, error: insertError } = await supabase
        .from('cards')
        .insert({
          deck_id: deckId,
          ru_text: ruText,
          en_text: enText,
          audio_url: audioUrl || null,
          position: nextPosition
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Ошибка вставки:', insertError);
        throw insertError;
      }

      console.log('✅ [3/3] Карточка создана:', data);

      // Редирект обратно к набору
      router.push(`/admin/decks/${deckId}`);
    } catch (err: any) {
      console.error('❌ Ошибка создания карточки:', err);
      setError(err.message || 'Ошибка создания карточки');
    } finally {
      setLoading(false);
    }
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
            ← Назад к набору {deckName && `"${deckName}"`}
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добавить карточку
          </h1>
          <p className="text-gray-700">
            Введите текст на русском и английском
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
                placeholder="Например: Яблоко"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                required
                disabled={loading}
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
                placeholder="Например: Apple"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 placeholder:text-gray-500"
                required
                disabled={loading}
              />
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
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-700">
                Ссылка на MP3 файл для озвучки карточки
              </p>
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
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создаём...' : 'Добавить карточку'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
