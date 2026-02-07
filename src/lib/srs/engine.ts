import type { UserCard, SrsTestType } from './types';

type PartialUpdate = Partial<UserCard> & { updated_at: string };

function now(): string {
  return new Date().toISOString();
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Study Mode ──

export function handleMarkKnow(card: UserCard): PartialUpdate {
  const updates: PartialUpdate = {
    marked_know_at: now(),
    last_seen_in_study: now(),
    updated_at: now(),
  };
  if (card.status === 'new' || card.status === 'relearning') {
    updates.status = 'learning';
  }
  return updates;
}

export function handleMarkDontKnow(card: UserCard): PartialUpdate {
  const updates: PartialUpdate = {
    marked_know_at: null,
    last_seen_in_study: now(),
    updated_at: now(),
  };
  if (card.status === 'new' || card.status === 'relearning') {
    updates.status = 'learning';
  }
  return updates;
}

// ── Primary Testing ──

export function getNextTestType(card: UserCard): SrsTestType | null {
  if (!card.test_choice_passed) return 'choice';
  if (!card.test_audio_passed) return 'audio';
  if (!card.test_dictation_passed) return 'dictation';
  return null;
}

export function handlePrimaryTestCorrect(card: UserCard, testType: SrsTestType): PartialUpdate {
  const updates: PartialUpdate = {
    reviews_count: card.reviews_count + 1,
    correct_streak: card.correct_streak + 1,
    last_test_type: testType,
    last_test_result: true,
    updated_at: now(),
  };

  // Mark this test as passed and increment attempts
  if (testType === 'choice') {
    updates.test_choice_passed = true;
    updates.test_choice_attempts = card.test_choice_attempts + 1;
  } else if (testType === 'audio') {
    updates.test_audio_passed = true;
    updates.test_audio_attempts = card.test_audio_attempts + 1;
  } else {
    updates.test_dictation_passed = true;
    updates.test_dictation_attempts = card.test_dictation_attempts + 1;
  }

  // Check if all 3 tests are now passed
  const choicePassed = testType === 'choice' ? true : card.test_choice_passed;
  const audioPassed = testType === 'audio' ? true : card.test_audio_passed;
  const dictationPassed = testType === 'dictation' ? true : card.test_dictation_passed;

  if (choicePassed && audioPassed && dictationPassed) {
    // Graduate to young
    updates.status = 'young';
    updates.graduated_at = now();
    updates.interval_days = 1;
    updates.next_review_at = addDays(1);
    // Reset test flags for future relearning
    updates.test_choice_passed = false;
    updates.test_audio_passed = false;
    updates.test_dictation_passed = false;
  } else if (card.status === 'learning') {
    // First test passed, move to testing
    updates.status = 'testing';
  }

  return updates;
}

export function handlePrimaryTestIncorrect(card: UserCard, testType: SrsTestType): PartialUpdate {
  const updates: PartialUpdate = {
    reviews_count: card.reviews_count + 1,
    correct_streak: 0,
    last_test_type: testType,
    last_test_result: false,
    updated_at: now(),
    // Reset ALL test flags
    test_choice_passed: false,
    test_audio_passed: false,
    test_dictation_passed: false,
    // Back to learning, must mark "know" again
    status: 'learning',
    marked_know_at: null,
  };

  // Increment attempts for the current test type
  if (testType === 'choice') {
    updates.test_choice_attempts = card.test_choice_attempts + 1;
  } else if (testType === 'audio') {
    updates.test_audio_attempts = card.test_audio_attempts + 1;
  } else {
    updates.test_dictation_attempts = card.test_dictation_attempts + 1;
  }

  return updates;
}

// ── Simple Review (flip-card) ──

export function handleSimpleReviewKnow(card: UserCard): PartialUpdate {
  if (['young', 'mature', 'relearning'].includes(card.status)) {
    return handleReviewCorrect(card);
  }
  return handleMarkKnow(card);
}

export function handleSimpleReviewDontKnow(card: UserCard): PartialUpdate {
  if (['young', 'mature', 'relearning'].includes(card.status)) {
    return handleReviewIncorrect(card);
  }
  return handleMarkDontKnow(card);
}

// ── Review Testing (SM-2) ──

export function handleReviewCorrect(card: UserCard): PartialUpdate {
  const updates: PartialUpdate = {
    reviews_count: card.reviews_count + 1,
    correct_streak: card.correct_streak + 1,
    last_test_result: true,
    updated_at: now(),
  };

  if (card.status === 'relearning') {
    // Restore to young/mature with halved interval
    const newInterval = Math.max(1, Math.round(card.interval_days * 0.5));
    updates.interval_days = newInterval;
    updates.next_review_at = addDays(newInterval);
    updates.status = newInterval >= 21 ? 'mature' : 'young';
  } else {
    // SM-2: interval *= ease_factor
    const newInterval = Math.max(1, Math.round(card.interval_days * card.ease_factor));
    updates.interval_days = newInterval;
    updates.next_review_at = addDays(newInterval);
    if (newInterval >= 21 && card.status === 'young') {
      updates.status = 'mature';
    }
  }

  return updates;
}

export function handleReviewIncorrect(card: UserCard): PartialUpdate {
  const newEase = Math.max(1.3, card.ease_factor - 0.2);

  return {
    status: 'relearning',
    reviews_count: card.reviews_count + 1,
    correct_streak: 0,
    lapses_count: card.lapses_count + 1,
    ease_factor: newEase,
    interval_days: 1,
    next_review_at: addDays(1),
    marked_know_at: null,
    test_choice_passed: false,
    test_audio_passed: false,
    test_dictation_passed: false,
    last_test_result: false,
    updated_at: now(),
  };
}
