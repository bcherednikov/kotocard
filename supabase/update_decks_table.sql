-- Обновление таблицы decks
-- Переименовываем title -> name и добавляем tags

-- 1. Переименовать title в name
ALTER TABLE decks RENAME COLUMN title TO name;

-- 2. Добавить поле tags (массив строк)
ALTER TABLE decks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Проверка
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'decks'
ORDER BY ordinal_position;
