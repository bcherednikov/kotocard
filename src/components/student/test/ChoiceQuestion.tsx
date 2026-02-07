'use client';

import type { ChoiceQuestion as ChoiceQuestionType } from '@/lib/srs/question-generator';

type Props = {
  question: ChoiceQuestionType;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  speakCard: (cardId: string, lang: 'en' | 'ru') => void;
};

export function ChoiceQuestion({ question, onAnswer, speakCard }: Props) {
  return (
    <div>
      {/* Question display */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
        <div className="text-center">
          <div className="text-5xl mb-6">🇬🇧</div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <p className="text-4xl font-bold text-gray-900">{question.questionText}</p>
            <button
              onClick={() => speakCard(question.targetCard.id, 'en')}
              className="text-3xl hover:scale-110 transition-transform"
              title="Прослушать"
            >
              🔊
            </button>
          </div>
          <p className="text-lg font-semibold text-gray-700">
            ✅ Выбери правильный перевод
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
