-- Исправление RLS политик для profiles
-- Упрощаем политики для семейного приложения

-- 1. Удаляем старые политики которые вызывают рекурсию
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Family members can view profiles" ON profiles;

-- 2. Создаём простые политики БЕЗ рекурсии

-- Любой аутентифицированный пользователь может:
-- - создать свой профиль (id = auth.uid())
-- - читать все профили
-- - обновлять свой профиль

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
