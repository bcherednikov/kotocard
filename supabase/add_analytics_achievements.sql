-- Analytics & Achievements Migration
-- Tables: daily_activity, user_achievements, user_streaks
-- RPC: increment_daily_activity

-- ═══════════════════════════════════════════════════════════
-- 1. daily_activity — one row per user per day, counters
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,

  words_studied INTEGER NOT NULL DEFAULT 0,
  words_learned INTEGER NOT NULL DEFAULT 0,
  reviews_completed INTEGER NOT NULL DEFAULT 0,
  tests_passed INTEGER NOT NULL DEFAULT 0,
  tests_failed INTEGER NOT NULL DEFAULT 0,
  choice_tests_passed INTEGER NOT NULL DEFAULT 0,
  audio_tests_passed INTEGER NOT NULL DEFAULT 0,
  dictation_tests_passed INTEGER NOT NULL DEFAULT 0,
  study_sessions INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date
  ON daily_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date_desc
  ON daily_activity(user_id, activity_date DESC);

ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily_activity"
  ON daily_activity FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily_activity"
  ON daily_activity FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily_activity"
  ON daily_activity FOR UPDATE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 2. user_achievements — unlocked achievements per user
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_date
  ON user_achievements(user_id, unlocked_at DESC);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 3. user_streaks — cached streak data for fast dashboard
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON user_streaks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streak"
  ON user_streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streak"
  ON user_streaks FOR UPDATE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 4. RPC: increment_daily_activity (atomic upsert)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_daily_activity(
  p_user_id UUID,
  p_date DATE,
  p_words_studied INTEGER DEFAULT 0,
  p_words_learned INTEGER DEFAULT 0,
  p_reviews_completed INTEGER DEFAULT 0,
  p_tests_passed INTEGER DEFAULT 0,
  p_tests_failed INTEGER DEFAULT 0,
  p_choice_tests_passed INTEGER DEFAULT 0,
  p_audio_tests_passed INTEGER DEFAULT 0,
  p_dictation_tests_passed INTEGER DEFAULT 0,
  p_study_sessions INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_activity (
    user_id, activity_date,
    words_studied, words_learned, reviews_completed,
    tests_passed, tests_failed,
    choice_tests_passed, audio_tests_passed, dictation_tests_passed,
    study_sessions
  ) VALUES (
    p_user_id, p_date,
    p_words_studied, p_words_learned, p_reviews_completed,
    p_tests_passed, p_tests_failed,
    p_choice_tests_passed, p_audio_tests_passed, p_dictation_tests_passed,
    p_study_sessions
  )
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    words_studied = daily_activity.words_studied + EXCLUDED.words_studied,
    words_learned = daily_activity.words_learned + EXCLUDED.words_learned,
    reviews_completed = daily_activity.reviews_completed + EXCLUDED.reviews_completed,
    tests_passed = daily_activity.tests_passed + EXCLUDED.tests_passed,
    tests_failed = daily_activity.tests_failed + EXCLUDED.tests_failed,
    choice_tests_passed = daily_activity.choice_tests_passed + EXCLUDED.choice_tests_passed,
    audio_tests_passed = daily_activity.audio_tests_passed + EXCLUDED.audio_tests_passed,
    dictation_tests_passed = daily_activity.dictation_tests_passed + EXCLUDED.dictation_tests_passed,
    study_sessions = daily_activity.study_sessions + EXCLUDED.study_sessions,
    updated_at = NOW();
END;
$$;
