# Piper TTS — подключение, голоса и скорость

Краткая шпаргалка по [Piper TTS](https://github.com/OHF-Voice/piper1-gpl): установка, выбор голосов и **настройка скорости речи**.

---

## 1. Установка

```bash
pip install piper-tts
```

Требуется Python ≥3.9. Дополнительно можно поставить `onnxruntime-gpu` для ускорения на GPU (флаг `--cuda` / `use_cuda=True`).

---

## 2. Голоса

### Список доступных голосов

```bash
python3 -m piper.download_voices
```

Выведет все голоса в формате `язык_регион-имя-качество`, например: `en_US-lessac-medium`, `ru_RU-dmitri-high`.

### Скачать конкретный голос

```bash
# В текущую директорию (или --data-dir /path/to/dir)
python3 -m piper.download_voices en_US-lessac-medium
python3 -m piper.download_voices ru_RU-dmitri-medium
```

После скачивания появятся два файла:
- `{имя}.onnx` — модель
- `{имя}.onnx.json` — конфиг (подхватывается автоматически)

### Качество голосов

| Качество | Частота | Параметры |
|----------|---------|-----------|
| x_low    | 16 kHz  | 5–7M      |
| low      | 16 kHz  | 15–20M    |
| medium   | 22.05 kHz | 15–20M  |
| high     | 22.05 kHz | 28–32M  |

### Русские голоса (ru_RU)

На [Hugging Face rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/main/ru/ru_RU):

- **denis** — мужской
- **dmitri** — мужской
- **irina** — женский
- **ruslan** — мужской

Примеры имён для скачивания: `ru_RU-dmitri-medium`, `ru_RU-irina-high`.

### Прослушать примеры

[Piper Voice Samples](https://rhasspy.github.io/piper-samples/) — можно выбрать язык и голос и послушать перед скачиванием.

---

## 3. Скорость речи (length scale)

**Да, скорость настраивается** через параметр **`length_scale`** (длина фонем):

- **`length_scale > 1.0`** — речь **медленнее** (например `1.5` ≈ в 1.5 раза медленнее)
- **`length_scale < 1.0`** — речь **быстрее** (например `0.8` — быстрее)
- **`length_scale = 1.0`** — по умолчанию

### Из командной строки

```bash
# Медленнее (удобно для обучения/детей)
python3 -m piper -m ru_RU-dmitri-medium -f out.wav --length-scale 1.3 -- "Текст для озвучки"

# Быстрее
python3 -m piper -m ru_RU-dmitri-medium -f out.wav --length-scale 0.85 -- "Текст для озвучки"
```

Допустимые формы флага: `--length-scale` или `--length_scale`.

### Из Python API

```python
import wave
from piper import PiperVoice, SynthesisConfig

voice = PiperVoice.load("/path/to/ru_RU-dmitri-medium.onnx")

syn_config = SynthesisConfig(
    length_scale=1.2,   # медленнее (например для детей)
    volume=1.0,
    noise_scale=0.667,
    noise_w_scale=0.8,
    normalize_audio=True,
)

with wave.open("output.wav", "wb") as wav_file:
    voice.synthesize_wav("Привет, это тест скорости.", wav_file, syn_config=syn_config)
```

Для стриминга по кускам:

```python
for chunk in voice.synthesize("Текст...", syn_config):
    # chunk.audio_int16_bytes, chunk.sample_rate, etc.
    ...
```

---

## 4. Дополнительные параметры синтеза

| Параметр         | Описание                          | По умолчанию | В проекте (config) |
|------------------|-----------------------------------|--------------|--------------------|
| `length_scale`   | Скорость (↑ = медленнее)          | 1.0          | по языку (en 1.5, ru 1.0) |
| `noise_scale`    | Вариативность звука (↓ = ровнее)   | 0.667        | 0.5                |
| `noise_w_scale`  | Вариативность длительности фонем  | 0.8          | 0.4                |
| `volume`         | Громкость (множитель)             | 1.0          | 1.0                |
| `normalize_audio`| Нормализация громкости            | True         | включено           |
| `speaker_id`     | ID спикера (многоголосые модели)  | 0            | 0                  |

Если голос звучит странно или «дрожит» — понизь `noise_scale` и `noise_w_scale` (в проекте: `src/lib/tts/config.ts`: `TTS_DEFAULT_NOISE_SCALE`, `TTS_DEFAULT_NOISE_W_SCALE`).  
В CLI: `--volume`, `--noise-scale`, `--noise-w-scale`, `--no-normalize`, `-s/--speaker`.

---

## 5. Минимальный пример (русский + медленная скорость)

```bash
pip install piper-tts
python3 -m piper.download_voices ru_RU-dmitri-medium
python3 -m piper -m ru_RU-dmitri-medium -f test.wav --length-scale 1.2 -- "Привет! Это тест озвучки с пониженной скоростью."
```

Файл `test.wav` будет в текущей директории.

---

## 6. Вариант через MCP (для Cursor / LobeHub и т.д.)

Есть [Piper TTS MCP Server](https://github.com/CryptoDappDev/piper-tts-mcp) — даёт инструмент `speak` в MCP-клиенте.

**Важно:** это не «Piper в облаке». MCP-сервер только дергает **локальный** Piper HTTP API на `localhost:5000`. То есть:

- **Без установки вообще** — нельзя: сервис Piper на :5000 должен быть запущен (Docker или `python3 -m piper.http_server`).
- **Без установки Piper на хост** — можно: поднять Piper в Docker, на машине только Docker + клон репо + `uv`.

### Минимальный сценарий (Piper в Docker)

```bash
git clone https://github.com/CryptoDappDev/piper-tts-mcp.git
cd piper-tts-mcp
docker compose up -d
```

В конфиге MCP (Cursor: настройки → MCP) добавить сервер с путём к клону и запуском `server.py` через `uv` (см. README репо). После этого инструмент `speak(text, length_scale=..., volume=...)` будет доступен, а сам Piper будет работать в контейнере.

Голос по умолчанию в этом MCP — `en_GB-cori-high`. Чтобы использовать русский, нужно пересобрать образ, изменив в Dockerfile голос на нужный (например `ru_RU-dmitri-medium`) и перезапустив контейнер.

---

## Ссылки

- Репозиторий: [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl)
- Голоса (Hugging Face): [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)
- Примеры голосов: [piper-samples](https://rhasspy.github.io/piper-samples/)
- Документация в репо: `docs/CLI.md`, `docs/API_PYTHON.md`, `docs/VOICES.md`
- Piper TTS MCP (локальный сервис + MCP): [CryptoDappDev/piper-tts-mcp](https://github.com/CryptoDappDev/piper-tts-mcp) / [LobeHub](https://lobehub.com/ru/mcp/cryptodappdev-piper-tts-mcp)
