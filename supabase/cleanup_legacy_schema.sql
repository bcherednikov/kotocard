-- ============================================
-- Этап 13: Очистка БД — удаление legacy-столбцов и таблиц
-- ============================================
-- ВАЖНО: выполнять ПОСЛЕ этапов 11-12 (миграция семей в группы + удаление старого кода)
-- ============================================

-- 1. Удалить старые RLS-политики

-- families
DROP POLICY IF EXISTS "Family members can view their family" ON families;
DROP POLICY IF EXISTS "Admins can update family" ON families;

-- profiles
DROP POLICY IF EXISTS "Family members can view profiles" ON profiles;

-- decks
DROP POLICY IF EXISTS "Family members can view decks" ON decks;
DROP POLICY IF EXISTS "Admins can manage decks" ON decks;

-- cards
DROP POLICY IF EXISTS "Family members can view cards" ON cards;
DROP POLICY IF EXISTS "Admins can manage cards" ON cards;

-- user_cards
DROP POLICY IF EXISTS "Admins can view family children user_cards" ON user_cards;

-- card_progress (legacy table)
DROP POLICY IF EXISTS "Users can view own progress" ON card_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON card_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON card_progress;

-- 2. Удалить legacy-столбцы

ALTER TABLE profiles DROP COLUMN IF EXISTS family_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE decks DROP COLUMN IF EXISTS family_id;
ALTER TABLE decks DROP COLUMN IF EXISTS created_by;

-- 3. Удалить legacy-индексы

DROP INDEX IF EXISTS idx_profiles_family_id;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_decks_family_id;

-- 4. Удалить legacy-таблицы

DROP TABLE IF EXISTS card_progress;
DROP TABLE IF EXISTS families;

-- ============================================
-- Готово! Проверить:
-- 1. profiles: нет колонок family_id, role
-- 2. decks: нет колонок family_id, created_by
-- 3. Нет таблиц families, card_progress
-- 4. Приложение работает
-- ============================================
