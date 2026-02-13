export type AnalyticsPeriod = 'week' | 'month' | '3months' | 'year';

export interface DailyActivityRow {
  id: string;
  user_id: string;
  activity_date: string; // YYYY-MM-DD
  words_studied: number;
  words_learned: number;
  reviews_completed: number;
  tests_passed: number;
  tests_failed: number;
  choice_tests_passed: number;
  audio_tests_passed: number;
  dictation_tests_passed: number;
  study_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface DailyActivityIncrements {
  words_studied: number;
  words_learned: number;
  reviews_completed: number;
  tests_passed: number;
  tests_failed: number;
  choice_tests_passed: number;
  audio_tests_passed: number;
  dictation_tests_passed: number;
  study_sessions: number;
}

export interface PeriodAnalytics {
  wordsLearned: number;
  wordsStudied: number;
  reviewsCompleted: number;
  testsPassed: number;
  dictationsPassed: number;
  audioPassed: number;
  studySessions: number;
  daysActive: number;
  decksCompleted: number;
  bestDay: { date: string; count: number } | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface TodayProgress {
  wordsStudied: number;
  reviewsCompleted: number;
  total: number; // wordsStudied + reviewsCompleted
  goal: number;  // 10
  completed: boolean;
}

export interface Last7Days {
  date: string;    // YYYY-MM-DD
  dayLabel: string; // Пн, Вт, etc
  completed: boolean;
}

export type AchievementCategory =
  | 'streak'
  | 'words'
  | 'decks'
  | 'tests'
  | 'reviews'
  | 'milestones'
  | 'special';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  icon: string;
  title: string;
  description: string;
  condition: (ctx: AchievementContext) => boolean;
  progressMax?: number;
  getProgress?: (ctx: AchievementContext) => number;
}

export interface AchievementContext {
  totalMastered: number;
  totalReviews: number;
  totalStudySessions: number;
  totalWordsStudied: number;
  totalTestsPassed: number;
  totalDictationsPassed: number;
  totalChoicePassed: number;
  totalAudioPassed: number;
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  decksCompleted: number;
  perfectTestSessions: number;
  currentHour: number;
  unlockedIds: Set<string>;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
