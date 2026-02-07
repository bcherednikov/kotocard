'use client';

type Props = {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  onNext: () => void;
  isLast: boolean;
  isProcessing?: boolean;
};

export function TestFeedback({ isCorrect, correctAnswer, userAnswer, onNext, isLast, isProcessing }: Props) {
  return (
    <div className={`rounded-2xl shadow-xl p-8 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{isCorrect ? '✅' : '❌'}</div>
        <h2 className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
          {isCorrect ? 'Правильно!' : 'Неправильно'}
        </h2>
        {!isCorrect && (
          <div className="mt-4">
            <p className="text-gray-700 mb-1">Твой ответ: <span className="font-semibold text-red-700">{userAnswer}</span></p>
            <p className="text-gray-700 mb-2">Правильный ответ:</p>
            <p className="text-2xl font-bold text-gray-900">{correctAnswer}</p>
          </div>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={isProcessing}
        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-xl hover:from-purple-600 hover:to-pink-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Сохраняем...' : isLast ? 'Завершить' : 'Следующий вопрос →'}
      </button>
    </div>
  );
}
