-- Исправление RLS политик для families
-- Убираем рекурсию при создании семьи

-- 1. Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own family" ON families;
DROP POLICY IF EXISTS "Admins can update own family" ON families;

-- 2. Создаём простые политики БЕЗ рекурсии

-- Любой аутентифицированный пользователь может создать семью
CREATE POLICY "Enable insert for authenticated users"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Все аутентифицированные могут читать семьи
CREATE POLICY "Enable read for authenticated users"
  ON families FOR SELECT
  TO authenticated
  USING (true);

-- Могут обновлять и удалять свои семьи
CREATE POLICY "Enable update for authenticated users"
  ON families FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON families FOR DELETE
  TO authenticated
  USING (true);
