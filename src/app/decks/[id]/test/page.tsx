'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPrimaryTestCards, getAllDeckCards, updateUserCard } from '@/lib/srs/queries';
import { getNextTestType, handlePrimaryTestCorrect, handlePrimaryTestIncorrect } from '@/lib/srs/engine';
import { generateChoiceQuestion, generateAudioQuestion, generateDictationQuestion } from '@/lib/srs/question-generator';
import type { SrsQuestion } from '@/lib/srs/question-generator';
import type { UserCardWithCard, SrsTestType, CardData } from '@/lib/srs/types';
import { ChoiceQuestion } from '@/components/student/test/ChoiceQuestion';
import { AudioQuestion } from '@/components/student/test/AudioQuestion';
import { DictationQuestion } from '@/components/student/test/DictationQuestion';
import { TestFeedback } from '@/components/student/test/TestFeedback';

const MAX_QUESTIONS = 30;

export default function PrimaryTestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const deckId = params.id as string;

  const [testCards, setTestCards] = useState<UserCardWithCard[]>([]);
  const [allDeckCards, setAllDeckCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SrsQuestion | null>(null);
  const [currentTestType, setCurrentTestType] = useState<SrsTestType | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState({ answer: '', isCorrect: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (profile && deckId) loadTestData();
  }, [profile, deckId]);

  async function loadTestData() {
    if (!profile) return;
    try {
      const [cards, deckCards] = await Promise.all([
        getPrimaryTestCards(supabase, profile.id, deckId),
        getAllDeckCards(supabase, deckId),
      ]);

      const limited = cards.slice(0, MAX_QUESTIONS);
      setTestCards(limited);
      setAllDeckCards(deckCards);

      if (limited.length > 0) prepareQuestion(limited[0], deckCards);
    } catch (err) {
      console.error('Error loading test data:', err);
    } finally {
      setLoading(false);
    }
  }

  function prepareQuestion(card: UserCardWithCard, deckCards: CardData[]) {
    const testType = getNextTestType(card);
    if (!testType) return;

    setCurrentTestType(testType);
    const cardData = card.cards;

    let question: SrsQuestion;
    switch (testType) {
      case 'choice': question = generateChoiceQuestion(cardData, deckCards); break;
      case 'audio': question = generateAudioQuestion(cardData, deckCards); break;
      case 'dictation': question = generateDictationQuestion(cardData); break;
    }
    setCurrentQuestion(question);
  }

  async function handleAnswer(answer: string, isCorrect: boolean) {
    setLastAnswer({ answer, isCorrect });
    setShowFeedback(true);

    const card = testCards[currentIndex];
    if (!card || !currentTestType) return;

    const updates = isCorrect
      ? handlePrimaryTestCorrect(card, currentTestType)
      : handlePrimaryTestIncorrect(card, currentTestType);

    try {
      await updateUserCard(supabase, card.user_card_id, updates);
    } catch (err) {
      console.error('Error saving test result:', err);
    }

    setStats({
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      incorrect: !isCorrect ? stats.incorrect + 1 : stats.incorrect,
    });
  }

  function handleNext() {
    if (isProcessing) return;
    setIsProcessing(true);

    if (currentIndex < testCards.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setShowFeedback(false);
      prepareQuestion(testCards[nextIdx], allDeckCards);
      setIsProcessing(false);
    } else {
      router.push(`/decks/${deckId}`);
    }
  }

  async function speakText(text: string, lang: 'en' | 'ru') {
    try {
      const { playTts } = await import('@/lib/tts');
      await playTts(text, lang);
    } catch (e) {
      console.error('TTS:', e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-800">Готовим тест...</p>
      </div>
    );
  }

  if (testCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек для тестирования</h1>
          <p className="text-gray-700 mb-6">Сначала просмотри карточки и отметь «Знаю»</p>
          <Link href={`/decks/${deckId}`} className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            ← Назад к набору
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href={`/decks/${deckId}`} className="px-4 py-2 bg-white rounded-lg shadow text-gray-700 hover:bg-gray-50 font-medium">← Выход</Link>
          <div className="text-lg font-semibold text-gray-800">{currentIndex + 1} из {testCards.length}</div>
          <div className="px-4 py-2 bg-white rounded-lg shadow">
            <span className="text-green-600 font-semibold">✓ {stats.correct}</span>{' / '}
            <span className="text-red-600 font-semibold">✗ {stats.incorrect}</span>
          </div>
        </div>

        <div className="w-full h-2 bg-white/50 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-300" style={{ width: `${((currentIndex + 1) / testCards.length) * 100}%` }} />
        </div>

        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow">
            {currentTestType === 'choice' && '📝 Выбор варианта'}
            {currentTestType === 'audio' && '🎧 Аудио тест'}
            {currentTestType === 'dictation' && '✍️ Диктант'}
          </span>
        </div>

        {!showFeedback && currentQuestion && (
          <>
            {currentQuestion.type === 'choice' && <ChoiceQuestion question={currentQuestion} onAnswer={handleAnswer} speakText={speakText} />}
            {currentQuestion.type === 'audio' && <AudioQuestion question={currentQuestion} onAnswer={handleAnswer} speakText={speakText} />}
            {currentQuestion.type === 'dictation' && <DictationQuestion question={currentQuestion} onAnswer={handleAnswer} speakText={speakText} />}
          </>
        )}

        {showFeedback && currentQuestion && (
          <TestFeedback
            isCorrect={lastAnswer.isCorrect}
            correctAnswer={currentQuestion.correctAnswer}
            userAnswer={lastAnswer.answer}
            onNext={handleNext}
            isLast={currentIndex >= testCards.length - 1}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}
