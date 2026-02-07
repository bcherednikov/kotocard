# Настройка Piper TTS на сервере

Эта инструкция для **одноразовой** настройки TTS на VPS после первого деплоя.

---

## Зачем отдельная настройка?

- `venv` с Mac **не работает** на Linux (разные пути, симлинки).
- `venv` **не копируется** при деплое (исключён в `scripts/deploy.sh`).
- Создаём `venv` **на сервере** один раз, затем он остаётся между деплоями.

---

## Шаги

### 1. Зайти на сервер

```bash
ssh root@45.89.228.209
```

### 2. Установить Python 3 и pip (если ещё не установлены)

```bash
apt update && apt install -y python3 python3-pip python3-venv
```

### 3. Перейти в папку приложения

```bash
cd /var/www/kotocard/piper-tts
```

### 4. Создать виртуальное окружение

```bash
python3 -m venv venv
```

### 5. Активировать venv и установить Piper

```bash
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 6. Скачать нужные голоса (опционально)

Например, русский женский голос:

```bash
python -m piper.download_voices ru_RU-irina-medium
```

Английский:

```bash
python -m piper.download_voices en_US-lessac-medium
```

Голоса (`.onnx` и `.onnx.json`) сохранятся в `/var/www/kotocard/piper-tts/`.

Список всех доступных голосов: [piper/VOICES.md](https://github.com/rhasspy/piper/blob/master/VOICES.md)

### 7. Деактивировать venv

```bash
deactivate
```

### 8. Проверка

После этого в `/var/www/kotocard/piper-tts/` должны быть:

- `venv/` (виртуальное окружение)
- `*.onnx` (модели голосов, если скачали)
- `*.onnx.json` (конфиги моделей)

---

## Готово

Теперь при запросах к `/api/tts` приложение будет вызывать `piper-tts/venv/bin/python -m piper ...`.

При последующих деплоях через `./scripts/deploy.sh`:
- Код обновляется
- `venv` на сервере **не трогается** (остаётся как есть)
- Сборка Next.js не падает (в `next.config.ts` исключён `piper-tts/`)

---

## Если нужно обновить Piper

```bash
cd /var/www/kotocard/piper-tts
source venv/bin/activate
pip install --upgrade piper-tts
deactivate
```
