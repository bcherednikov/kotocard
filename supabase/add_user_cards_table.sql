-- SRS (Spaced Repetition System) - таблица user_cards
-- Заменяет концептуально card_progress для нового SRS-флоу

CREATE TABLE IF NOT EXISTS user_cards (
  user_card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

  -- Статус карточки в SRS lifecycle
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'learning', 'testing', 'young', 'mature', 'relearning')),

  -- SM-2 алгоритм
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,

  -- Счётчики
  reviews_count INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  lapses_count INTEGER NOT NULL DEFAULT 0,

  -- Флаги первичных тестов (choice -> audio -> dictation)
  test_choice_passed BOOLEAN NOT NULL DEFAULT FALSE,
  test_audio_passed BOOLEAN NOT NULL DEFAULT FALSE,
  test_dictation_passed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Счётчики попыток тестов
  test_choice_attempts INTEGER NOT NULL DEFAULT 0,
  test_audio_attempts INTEGER NOT NULL DEFAULT 0,
  test_dictation_attempts INTEGER NOT NULL DEFAULT 0,

  -- Временные метки флоу
  last_seen_in_study TIMESTAMPTZ,
  marked_know_at TIMESTAMPTZ,
  last_test_type TEXT CHECK (last_test_type IN ('choice', 'audio', 'dictation') OR last_test_type IS NULL),
  last_test_result BOOLEAN,
  graduated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, card_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_cards_user_deck ON user_cards(user_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_status ON user_cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_review ON user_cards(user_id, next_review_at);

-- RLS
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Пользователи видят и управляют своими записями
CREATE POLICY "Users can view own user_cards"
  ON user_cards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own user_cards"
  ON user_cards FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own user_cards"
  ON user_cards FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own user_cards"
  ON user_cards FOR DELETE
  USING (user_id = auth.uid());

-- Админы (родители) могут смотреть записи детей из своей семьи
CREATE POLICY "Admins can view family children user_cards"
  ON user_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
        AND admin_p.role = 'admin'
        AND admin_p.family_id = (
          SELECT family_id FROM profiles WHERE id = user_cards.user_id
        )
    )
  );
