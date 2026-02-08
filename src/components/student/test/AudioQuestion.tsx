'use client';

import { useEffect } from 'react';
import type { AudioQuestion as AudioQuestionType } from '@/lib/srs/question-generator';

type Props = {
  question: AudioQuestionType;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  speakText: (text: string, lang: 'en' | 'ru') => void;
};

export function AudioQuestion({ question, onAnswer, speakText }: Props) {
  // Auto-play audio on mount
  useEffect(() => {
    speakText(question.audioText, 'en');
  }, [question.audioText]);

  return (
    <div>
      {/* Question display */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-6">Прослушай слово:</p>
          <button
            onClick={() => speakText(question.audioText, 'en')}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl text-2xl hover:bg-blue-600 transition active:scale-95"
          >
            🔊 Воспроизвести
          </button>
          <p className="text-lg font-semibold text-gray-700 mt-6">
            🎧 Выбери правильный перевод
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.cardId}
              onClick={() => onAnswer(option.text, option.isCorrect)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition text-lg font-medium text-gray-900"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
