-- ============================================
-- ПРОВЕРКА БАЗЫ ДАННЫХ KotoCard
-- ============================================

-- 1. Проверка существования таблиц
SELECT 
  'ТАБЛИЦЫ' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Существует'
    ELSE '❌ Отсутствует'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('families', 'profiles', 'decks', 'cards', 'card_progress', 'study_sessions', 'session_results')
ORDER BY table_name;

-- 2. Количество записей в каждой таблице
SELECT 'ДАННЫЕ: families' as info, COUNT(*) as count FROM families
UNION ALL
SELECT 'ДАННЫЕ: profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'ДАННЫЕ: decks', COUNT(*) FROM decks
UNION ALL
SELECT 'ДАННЫЕ: cards', COUNT(*) FROM cards
UNION ALL
SELECT 'ДАННЫЕ: card_progress', COUNT(*) FROM card_progress
UNION ALL
SELECT 'ДАННЫЕ: study_sessions', COUNT(*) FROM study_sessions
UNION ALL
SELECT 'ДАННЫЕ: session_results', COUNT(*) FROM session_results;

-- 3. Проверка тестовых данных
SELECT 
  'ТЕСТОВАЯ СЕМЬЯ' as check_type,
  name,
  created_at
FROM families
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 4. Проверка тестового набора
SELECT 
  'ТЕСТОВЫЙ НАБОР' as check_type,
  title,
  description
FROM decks
WHERE id = '00000000-0000-0000-0000-000000000002';

-- 5. Проверка тестовых карточек
SELECT 
  'ТЕСТОВЫЕ КАРТОЧКИ' as check_type,
  position,
  ru_text,
  en_text,
  transcription_ipa,
  transcription_ru
FROM cards
WHERE deck_id = '00000000-0000-0000-0000-000000000002'
ORDER BY position;

-- 6. Проверка RLS политик
SELECT 
  'RLS ПОЛИТИКИ' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
  END as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Проверка индексов
SELECT 
  'ИНДЕКСЫ' as check_type,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('families', 'profiles', 'decks', 'cards', 'card_progress', 'study_sessions', 'session_results')
ORDER BY tablename, indexname;
