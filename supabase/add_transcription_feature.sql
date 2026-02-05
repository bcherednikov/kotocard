-- Добавление функции русской транскрипции
-- Это позволит детям с трудностями в чтении видеть русскую транскрипцию английских слов

-- 1. Добавить опцию в профиль
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS show_russian_transcription BOOLEAN DEFAULT false;

-- 2. Добавить поле для транскрипции в карточки
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS ru_transcription TEXT;

-- Комментарии для документации
COMMENT ON COLUMN profiles.show_russian_transcription IS 'Показывать русскую транскрипцию английских слов (например: one → уан)';
COMMENT ON COLUMN cards.ru_transcription IS 'Русская фонетическая транскрипция английского слова (например: apple → эпл)';
