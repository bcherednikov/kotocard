-- KotoCard Database Schema
-- Created: 2026-02-04
-- Phase 0, Milestone 0.3

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Table: families
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: profiles (связана с auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: decks
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  ru_text TEXT NOT NULL,
  en_text TEXT NOT NULL,
  transcription_ipa TEXT,
  transcription_ru TEXT,
  image_url TEXT,
  audio_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: card_progress
CREATE TABLE IF NOT EXISTS card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('ru_to_en', 'en_to_ru')),
  status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'mastered', 'archived')),
  times_shown INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_incorrect INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id, direction)
);

-- Table: study_sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('ru_to_en', 'en_to_ru')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_cards INTEGER NOT NULL DEFAULT 0
);

-- Table: session_results
CREATE TABLE IF NOT EXISTS session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  user_answer TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_decks_family_id ON decks(family_id);
CREATE INDEX IF NOT EXISTS idx_decks_created_by ON decks(created_by);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(deck_id, position);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON card_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_card_id ON card_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON card_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deck_id ON study_sessions(deck_id);

CREATE INDEX IF NOT EXISTS idx_results_session_id ON session_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_card_id ON session_results(card_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policies for families
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policies for profiles
CREATE POLICY "Family members can view profiles"
  ON profiles FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Policies for decks
CREATE POLICY "Family members can view decks"
  ON decks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage decks"
  ON decks FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for cards
CREATE POLICY "Family members can view cards"
  ON cards FOR SELECT
  USING (
    deck_id IN (
      SELECT d.id FROM decks d
      INNER JOIN profiles p ON d.family_id = p.family_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage cards"
  ON cards FOR ALL
  USING (
    deck_id IN (
      SELECT d.id FROM decks d
      INNER JOIN profiles p ON d.family_id = p.family_id
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policies for card_progress
CREATE POLICY "Users can view own progress"
  ON card_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own progress"
  ON card_progress FOR ALL
  USING (user_id = auth.uid());

-- Policies for study_sessions
CREATE POLICY "Users can manage own sessions"
  ON study_sessions FOR ALL
  USING (user_id = auth.uid());

-- Policies for session_results
CREATE POLICY "Users can manage own results"
  ON session_results FOR ALL
  USING (
    session_id IN (
      SELECT id FROM study_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. INSERT TEST DATA
-- ============================================

-- Test family
INSERT INTO families (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Тестовая Семья')
ON CONFLICT (id) DO NOTHING;

-- Test deck
INSERT INTO decks (id, family_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Test Deck',
  'Тестовый набор для проверки'
)
ON CONFLICT (id) DO NOTHING;

-- Test cards
INSERT INTO cards (deck_id, ru_text, en_text, transcription_ipa, transcription_ru, position)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'первый', 'first', '/fɜːst/', 'фёрст', 1),
  ('00000000-0000-0000-0000-000000000002', 'второй', 'second', '/ˈsekənd/', 'сэ́конд', 2),
  ('00000000-0000-0000-0000-000000000002', 'третий', 'third', '/θɜːd/', 'сёрд', 3)
ON CONFLICT DO NOTHING;
