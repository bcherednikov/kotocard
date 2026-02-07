# Предгенерированное TTS-аудио

Новая архитектура TTS: файлы генерируются при создании карточки и хранятся на сервере.

---

## Архитектура

### Хранение файлов

```
/var/www/kotocard/public/tts/{family_id}/{deck_id}/{card_id}_{lang}.wav
```

**Пример:**
```
/var/www/kotocard/public/tts/abc123/deck456/card789_en.wav
/var/www/kotocard/public/tts/abc123/deck456/card789_ru.wav
```

**Доступ через браузер:**
```
http://45.89.228.209/tts/abc123/deck456/card789_en.wav
```

### База данных

Добавлены поля в таблицу `cards`:

| Поле | Тип | Описание |
|------|-----|----------|
| `tts_en_url` | TEXT | URL английского TTS-файла (`/tts/...`) |
| `tts_ru_url` | TEXT | URL русского TTS-файла (`/tts/...`) |
| `tts_generated_at` | TIMESTAMP | Когда было сгенерировано |

---

## Логика работы

### 1. При создании карточки (bulk-create)

1. API создаёт карточки в БД
2. **Фоновая задача:** генерирует TTS для `en_text` и `ru_text`
3. Сохраняет файлы в `public/tts/...`
4. Обновляет `tts_en_url` / `tts_ru_url` в БД

**Плюсы:**
- Не блокирует создание карточки
- Генерация происходит параллельно
- Пользователь не ждёт

### 2. При воспроизведении (фронтенд)

**Новый метод:** `playTtsForCard(cardId, lang)`

1. Запрос: `GET /api/tts/card/{cardId}?lang=en`
2. API проверяет `tts_en_url` в БД
3. Если есть → возвращает готовый файл (Cache-Control: 1 год)
4. Если нет → генерирует на лету, сохраняет, обновляет БД

**Плюсы:**
- Мгновенная отдача (0.1-0.5 сек вместо 3-5 сек)
- Fallback: если файл не сгенерирован, создаётся on-the-fly

### 3. При редактировании карточки

**TODO:** При изменении `en_text` или `ru_text`:
1. Удалить старые TTS-файлы
2. Обнулить `tts_en_url` / `tts_ru_url`
3. При следующем воспроизведении → регенерировать

---

## API Endpoints

### `POST /api/cards/[id]/generate-tts`
Ручная генерация TTS для карточки (для админки или повторной генерации).

**Ответ:**
```json
{
  "success": true,
  "tts_en_url": "/tts/family/deck/card_en.wav",
  "tts_ru_url": "/tts/family/deck/card_ru.wav"
}
```

### `GET /api/tts/card/[id]?lang=en`
Получить TTS-аудио для карточки (предгенерированное или on-the-fly).

**Ответ:** WAV-файл (`audio/wav`)

### `POST /api/tts` (legacy)
Старый endpoint: генерация TTS на лету по тексту (для совместимости).

---

## Фронтенд

### Использование

```typescript
import { playTtsForCard } from '@/lib/tts';

// В компоненте карточки
await playTtsForCard(card.id, 'en');
```

### Миграция с `playTts` на `playTtsForCard`

**Старый код:**
```typescript
playTts(card.en_text, 'en');
```

**Новый код:**
```typescript
playTtsForCard(card.id, 'en');
```

---

## Объём хранилища

**Средний размер TTS-файла:**
- Короткое слово (~5 символов): 40-50 KB
- Фраза (~50 символов): 150-200 KB
- Длинное предложение (~200 символов): 300-400 KB

**Прогноз:**
- 1000 карточек × 2 языка × 70 KB = **140 MB**
- 5000 карточек × 2 языка × 70 KB = **700 MB**
- 10000 карточек × 2 языка × 70 KB = **1.4 GB**

VPS: 10 GB → хватит на ~70 000 карточек.

---

## Миграция существующих карточек

Для генерации TTS всех существующих карточек:

```bash
# На сервере
curl -X POST http://localhost:3000/api/admin/regenerate-all-tts
```

(TODO: создать endpoint)

Или вручную для каждой карточки:
```bash
curl -X POST http://localhost:3000/api/cards/{card_id}/generate-tts
```

---

## Мониторинг

### Проверить место на диске

```bash
du -sh /var/www/kotocard/public/tts
```

### Карточки без TTS

```sql
SELECT COUNT(*) FROM cards WHERE tts_en_url IS NULL OR tts_ru_url IS NULL;
```

### Регенерировать устаревшие

```sql
-- Карточки, изменённые после генерации TTS
SELECT id, en_text, ru_text 
FROM cards 
WHERE updated_at > tts_generated_at;
```

---

## TODO

- [ ] Endpoint для массовой регенерации TTS
- [ ] Удаление TTS-файлов при удалении карточки
- [ ] Обнуление TTS при редактировании текста
- [ ] Админка: статистика по TTS (сколько сгенерировано, сколько осталось)
- [ ] Сжатие в MP3 (для экономии места)
