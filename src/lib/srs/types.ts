export type UserCardStatus = 'new' | 'learning' | 'testing' | 'young' | 'mature' | 'relearning';

export type SrsTestType = 'choice' | 'audio' | 'dictation';

export interface UserCard {
  user_card_id: string;
  card_id: string;
  user_id: string;
  deck_id: string;
  status: UserCardStatus;

  ease_factor: number;
  interval_days: number;
  next_review_at: string | null;

  reviews_count: number;
  correct_streak: number;
  lapses_count: number;

  test_choice_passed: boolean;
  test_audio_passed: boolean;
  test_dictation_passed: boolean;

  test_choice_attempts: number;
  test_audio_attempts: number;
  test_dictation_attempts: number;

  last_seen_in_study: string | null;
  marked_know_at: string | null;
  last_test_type: SrsTestType | null;
  last_test_result: boolean | null;
  graduated_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface CardData {
  id: string;
  deck_id: string;
  ru_text: string;
  en_text: string;
  ru_transcription: string | null;
  audio_url: string | null;
}

export interface UserCardWithCard extends UserCard {
  cards: CardData;
}

export interface DeckSrsStats {
  total: number;
  newCount: number;
  learningCount: number;
  testingCount: number;
  youngCount: number;
  matureCount: number;
  relearningCount: number;
  masteredCount: number; // young + mature
  masteryPercent: number;
  readyForReview: number;
  readyForTesting: number;
}
