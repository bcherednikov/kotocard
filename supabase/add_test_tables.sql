-- Добавление таблиц для системы тестирования

-- Таблица для сессий тестов
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'random_mix', -- Тип теста (пока только random_mix)
  total_questions INTEGER NOT NULL DEFAULT 10,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица для результатов по каждому вопросу
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  question_display TEXT NOT NULL, -- 'text_en', 'text_ru', 'audio_en', 'audio_ru'
  answer_mode TEXT NOT NULL, -- 'choice_text_en', 'choice_audio_en', 'input_en', etc.
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INTEGER, -- Время на ответ в миллисекундах
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON test_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_session_id ON test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_card_id ON test_results(card_id);

-- RLS политики для test_sessions
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test sessions"
  ON test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own test sessions"
  ON test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test sessions"
  ON test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS политики для test_results
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test results"
  ON test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions
      WHERE test_sessions.id = test_results.session_id
      AND test_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own test results"
  ON test_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions
      WHERE test_sessions.id = test_results.session_id
      AND test_sessions.user_id = auth.uid()
    )
  );

-- Комментарии для документации
COMMENT ON TABLE test_sessions IS 'Сессии тестирования пользователей';
COMMENT ON TABLE test_results IS 'Результаты по каждому вопросу в тесте';
COMMENT ON COLUMN test_results.question_display IS 'Как показывался вопрос: text_en, text_ru, audio_en, audio_ru';
COMMENT ON COLUMN test_results.answer_mode IS 'Режим ответа: choice_text_en, choice_audio_en, input_en, input_ru, etc.';
