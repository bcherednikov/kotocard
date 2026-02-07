-- Добавление полей для предгенерированного TTS-аудио
-- Файлы хранятся на VPS в /var/www/kotocard/public/tts/

-- Добавить поля для URL TTS-файлов
ALTER TABLE cards 
  ADD COLUMN IF NOT EXISTS tts_en_url TEXT,
  ADD COLUMN IF NOT EXISTS tts_ru_url TEXT,
  ADD COLUMN IF NOT EXISTS tts_generated_at TIMESTAMP WITH TIME ZONE;

-- Комментарии
COMMENT ON COLUMN cards.tts_en_url IS 'URL предгенерированного TTS для en_text (путь: /tts/{family_id}/{deck_id}/{card_id}_en.wav)';
COMMENT ON COLUMN cards.tts_ru_url IS 'URL предгенерированного TTS для ru_text (путь: /tts/{family_id}/{deck_id}/{card_id}_ru.wav)';
COMMENT ON COLUMN cards.tts_generated_at IS 'Когда было сгенерировано TTS-аудио (для отслеживания устаревших файлов)';

-- Индекс для поиска карточек без TTS
CREATE INDEX IF NOT EXISTS idx_cards_tts_pending 
  ON cards(deck_id) 
  WHERE tts_en_url IS NULL OR tts_ru_url IS NULL;
