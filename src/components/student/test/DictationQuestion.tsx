'use client';

import { useState, useEffect } from 'react';
import type { DictationQuestion as DictationQuestionType } from '@/lib/srs/question-generator';

type Props = {
  question: DictationQuestionType;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  speakCard: (cardId: string, lang: 'en' | 'ru') => void;
};

export function DictationQuestion({ question, onAnswer, speakCard }: Props) {
  const [userInput, setUserInput] = useState('');

  // Auto-play audio on mount
  useEffect(() => {
    speakCard(question.targetCard.id, 'en');
  }, [question.targetCard.id]);

  // Reset input when question changes
  useEffect(() => {
    setUserInput('');
  }, [question.targetCard.id]);

  function handleSubmit() {
    const trimmed = userInput.trim();
    if (!trimmed) return;
    const isCorrect = trimmed.toLowerCase() === question.correctAnswer.toLowerCase();
    onAnswer(trimmed, isCorrect);
  }

  return (
    <div>
      {/* Question display */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-6">Прослушай и напиши слово:</p>
          <button
            onClick={() => speakCard(question.targetCard.id, 'en')}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl text-2xl hover:bg-blue-600 transition active:scale-95"
          >
            🔊 Воспроизвести
          </button>
          <p className="text-lg font-semibold text-gray-700 mt-6">
            ✍️ Напиши что слышишь на английском
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && userInput.trim()) {
              handleSubmit();
            }
          }}
          placeholder="Введи слово на английском..."
          className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-xl text-gray-900 focus:border-blue-500 focus:outline-none mb-4"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!userInput.trim()}
          className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-xl hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ответить
        </button>
      </div>
    </div>
  );
}
