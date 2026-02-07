# Piper TTS (отдельная установка)

Локальная установка [Piper TTS](https://github.com/OHF-Voice/piper1-gpl) для использования в KotoCard. Лежит отдельно от основного кода проекта.

**Подключённые голоса:** `en_US-ryan-low` (английский), `ru_RU-ruslan-medium` (русский).  
**Настройка скорости по языкам:** в коде проекта см. `src/lib/tts/config.ts` — `TTS_DEFAULT_SPEED_BY_LANG`.

## Требования

- Python 3.9+ (рекомендуется 3.10–3.12)

## Установка (уже выполнена)

```bash
cd piper-tts
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Голоса

Голоса **не скачаны** по умолчанию. Когда будешь готов — напиши, какие нужны, затем:

```bash
source venv/bin/activate
python -m piper.download_voices <имя_голоса>   # например ru_RU-dmitri-medium
```

Файлы появятся в текущей папке (`piper-tts/`). Список голосов: `python -m piper.download_voices` (без аргументов). Примеры: [Piper Voice Samples](https://rhasspy.github.io/piper-samples/).

## Запуск HTTP‑сервера (для интеграции с приложением)

После того как скачаешь хотя бы один голос:

```bash
source venv/bin/activate
python -m piper.http_server -m <имя_голоса> --data-dir .
```

Сервер поднимется на `http://localhost:5000`. Документация API: [doc/Piper_TTS_Integration.md](../doc/Piper_TTS_Integration.md).

## CLI (проверка без сервера)

```bash
source venv/bin/activate
python -m piper -m <имя_голоса> -f out.wav --length-scale 1.2 -- "Текст для озвучки"
```
