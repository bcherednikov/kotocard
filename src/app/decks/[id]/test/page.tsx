'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useTestData } from '@/hooks/useDeckData';
import { updateUserCard } from '@/lib/srs/queries';
import { getNextTestType, handlePrimaryTestCorrect, handlePrimaryTestIncorrect } from '@/lib/srs/engine';
import { generateChoiceQuestion, generateAudioQuestion, generateDictationQuestion } from '@/lib/srs/question-generator';
import type { SrsQuestion } from '@/lib/srs/question-generator';
import type { UserCardWithCard, SrsTestType, CardData } from '@/lib/srs/types';
import { ChoiceQuestion } from '@/components/student/test/ChoiceQuestion';
import { AudioQuestion } from '@/components/student/test/AudioQuestion';
import { DictationQuestion } from '@/components/student/test/DictationQuestion';
import { TestFeedback } from '@/components/student/test/TestFeedback';
import { trackActivityInBackground } from '@/lib/analytics/tracker';
import type { DailyActivityIncrements } from '@/lib/analytics/types';
import { ImmersiveShell } from '@/components/layout/ImmersiveShell';
import { Badge } from '@/components/ui/badge';

const MAX_QUESTIONS = 30;

export default function PrimaryTestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();

  const deckId = params.id as string;
  const { data: testData, isLoading } = useTestData(deckId);

  const [testCards, setTestCards] = useState<UserCardWithCard[]>([]);
  const [allDeckCards, setAllDeckCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SrsQuestion | null>(null);
  const [currentTestType, setCurrentTestType] = useState<SrsTestType | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState({ answer: '', isCorrect: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  // Populate local state from SWR data once loaded
  useEffect(() => {
    if (!testData || sessionStarted) return;
    const cards = (testData.testCards ?? []) as UserCardWithCard[];
    const deckCards = (testData.allDeckCards ?? []) as CardData[];
    setTestCards(cards);
    setAllDeckCards(deckCards);
    setSessionStarted(true);
    if (cards.length > 0) {
      prepareQuestion(cards[0], deckCards);
      if (profile) trackActivityInBackground(supabase, profile.id, { study_sessions: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testData, sessionStarted, profile]);

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
      const increments: Partial<DailyActivityIncrements> = {};
      if (isCorrect) {
        increments.tests_passed = 1;
        if (currentTestType === 'choice') increments.choice_tests_passed = 1;
        else if (currentTestType === 'audio') increments.audio_tests_passed = 1;
        else if (currentTestType === 'dictation') increments.dictation_tests_passed = 1;
        if (updates.status === 'young') increments.words_learned = 1;
      } else {
        increments.tests_failed = 1;
      }
      trackActivityInBackground(supabase, user!.id, increments);
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

  const progress = testCards.length > 0 ? Math.round(((currentIndex + 1) / testCards.length) * 100) : 0;

  const testTypeLabel =
    currentTestType === 'choice' ? '📝 Выбор варианта' :
    currentTestType === 'audio' ? '🎧 Аудио тест' :
    currentTestType === 'dictation' ? '✍️ Диктант' : 'Тест';

  if (isLoading || !sessionStarted) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Тестирование">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">Готовим тест...</p>
        </div>
      </ImmersiveShell>
    );
  }

  if (testCards.length === 0) {
    return (
      <ImmersiveShell backHref={`/decks/${deckId}`} title="Тестирование">
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📝</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Нет карточек для тестирования</h1>
            <p className="text-gray-500 text-sm">Сначала просмотри карточки и отметь «Знаю»</p>
          </div>
        </div>
      </ImmersiveShell>
    );
  }

  return (
    <ImmersiveShell
      backHref={`/decks/${deckId}`}
      title={`${currentIndex + 1} / ${testCards.length}`}
      progress={progress}
      leftBadge={<Badge variant="green">✓ {stats.correct}</Badge>}
      rightBadge={<Badge variant="red">✗ {stats.incorrect}</Badge>}
    >
      <div className="py-6 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 shadow-sm">
            {testTypeLabel}
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
    </ImmersiveShell>
  );
}
