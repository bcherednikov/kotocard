-- Скрипт для переприменения RLS политик на таблицу profiles
-- Запустите этот скрипт в Supabase SQL Editor если возникают проблемы с доступом

-- 1. Удалить все существующие политики
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;

-- Удалить старые политики (если остались)
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Family members can view profiles" ON profiles;

-- 2. Убедиться что RLS включён
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Создать простые политики
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Enable delete for users based on id"
  ON profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- 4. Проверить что политики созданы
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Должно показать 4 политики:
-- 1. Enable insert for authenticated users (INSERT)
-- 2. Enable read for authenticated users (SELECT)
-- 3. Enable update for users based on id (UPDATE)
-- 4. Enable delete for users based on id (DELETE)
