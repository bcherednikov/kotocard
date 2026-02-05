'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type TestResult = {
  card: {
    ru_text: string;
    en_text: string;
  };
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  question_display: string;
  answer_mode: string;
};

export default function TestCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sessionId = searchParams.get('session');
  const correct = parseInt(searchParams.get('correct') || '0');
  const total = parseInt(searchParams.get('total') || '10');

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (sessionId && user) {
      loadResults();
    }
  }, [sessionId, user]);

  async function loadResults() {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          card:cards(ru_text, en_text)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setResults(data || []);
    } catch (err) {
      console.error('Ошибка загрузки результатов:', err);
    } finally {
      setLoading(false);
    }
  }

  const percentage = Math.round((correct / total) * 100);
  const isPerfect = correct === total;
  const isGood = percentage >= 70;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Загрузка результатов...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Результат */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
          <div className="text-8xl mb-6">
            {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isPerfect ? 'Идеально!' : isGood ? 'Отличная работа!' : 'Продолжай тренироваться!'}
          </h1>
          
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <div className="text-5xl font-bold text-green-600">{correct}</div>
              <div className="text-gray-700">Правильно</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div>
              <div className="text-5xl font-bold text-gray-800">{total}</div>
              <div className="text-gray-700">Всего</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">{percentage}%</div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isPerfect ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  isGood ? 'bg-gradient-to-r from-blue-400 to-purple-600' :
                  'bg-gradient-to-r from-orange-400 to-red-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/student/test/random-mix"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition shadow-lg"
            >
              Повторить тест
            </Link>
            <Link
              href="/student/decks"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
            >
              К обучению
            </Link>
          </div>
        </div>

        {/* Детальные результаты */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 Подробные результаты
            </h2>
            
            <div className="space-y-4">
              {results.map((result, index) => {
                const card = result.card as { ru_text: string; en_text: string };
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      result.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {result.is_correct ? '✅' : '❌'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">
                            {card.ru_text}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="font-bold text-gray-900">
                            {card.en_text}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className={result.is_correct ? 'text-green-700' : 'text-red-700'}>
                            <span className="font-semibold">Твой ответ:</span> {result.user_answer}
                          </div>
                          {!result.is_correct && (
                            <div className="text-green-700">
                              <span className="font-semibold">Правильно:</span> {result.correct_answer}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex gap-2">
                          <span className="px-2 py-1 bg-white rounded text-xs text-gray-600">
                            {result.question_display === 'text_en' ? '📝 Текст EN' :
                             result.question_display === 'text_ru' ? '📝 Текст RU' :
                             result.question_display === 'audio_en' ? '🔊 Аудио EN' :
                             '🔊 Аудио RU'}
                          </span>
                          <span className="px-2 py-1 bg-white rounded text-xs text-gray-600">
                            {result.answer_mode.startsWith('choice_') ? '✅ Выбор' : '✍️ Ввод'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
