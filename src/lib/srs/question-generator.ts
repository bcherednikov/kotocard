import type { CardData } from './types';

export type ChoiceQuestion = {
  type: 'choice';
  targetCard: CardData;
  questionText: string;
  questionLang: 'en' | 'ru';
  options: { text: string; cardId: string; isCorrect: boolean }[];
  correctAnswer: string;
};

export type AudioQuestion = {
  type: 'audio';
  targetCard: CardData;
  audioText: string; // EN text to speak
  options: { text: string; cardId: string; isCorrect: boolean }[];
  correctAnswer: string;
};

export type DictationQuestion = {
  type: 'dictation';
  targetCard: CardData;
  audioText: string; // EN text to speak
  correctAnswer: string;
};

export type SrsQuestion = ChoiceQuestion | AudioQuestion | DictationQuestion;

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickWrongOptions(
  targetCard: CardData,
  allCards: CardData[],
  count: number
): CardData[] {
  const others = allCards.filter((c) => c.id !== targetCard.id);
  return shuffle(others).slice(0, count);
}

/**
 * Choice test: show EN word, pick correct RU translation from 4 options.
 */
export function generateChoiceQuestion(
  targetCard: CardData,
  allDeckCards: CardData[]
): ChoiceQuestion {
  const wrongCards = pickWrongOptions(targetCard, allDeckCards, 3);

  const options = shuffle([
    { text: targetCard.ru_text, cardId: targetCard.id, isCorrect: true },
    ...wrongCards.map((c) => ({
      text: c.ru_text,
      cardId: c.id,
      isCorrect: false,
    })),
  ]);

  return {
    type: 'choice',
    targetCard,
    questionText: targetCard.en_text,
    questionLang: 'en',
    options,
    correctAnswer: targetCard.ru_text,
  };
}

/**
 * Audio test: play EN audio, pick correct RU translation from 4 options.
 */
export function generateAudioQuestion(
  targetCard: CardData,
  allDeckCards: CardData[]
): AudioQuestion {
  const wrongCards = pickWrongOptions(targetCard, allDeckCards, 3);

  const options = shuffle([
    { text: targetCard.ru_text, cardId: targetCard.id, isCorrect: true },
    ...wrongCards.map((c) => ({
      text: c.ru_text,
      cardId: c.id,
      isCorrect: false,
    })),
  ]);

  return {
    type: 'audio',
    targetCard,
    audioText: targetCard.en_text,
    options,
    correctAnswer: targetCard.ru_text,
  };
}

/**
 * Dictation test: play EN audio, type the EN word.
 */
export function generateDictationQuestion(
  targetCard: CardData
): DictationQuestion {
  return {
    type: 'dictation',
    targetCard,
    audioText: targetCard.en_text,
    correctAnswer: targetCard.en_text,
  };
}
