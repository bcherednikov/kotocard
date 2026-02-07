/**
 * Конфиг Piper TTS: голос и скорость по умолчанию.
 * Скорость (length_scale): 1.0 = нормально, >1 = медленнее, <1 = быстрее.
 */
export type TtsLang = 'en' | 'ru';

export const TTS_VOICE_BY_LANG: Record<TtsLang, string> = {
  en: 'en_US-amy-low',
  ru: 'ru_RU-ruslan-medium',
};

/** Скорость воспроизведения по умолчанию (length_scale). */
export const TTS_DEFAULT_SPEED_BY_LANG: Record<TtsLang, number> = {
  en: 1.2,
  ru: 1.2,
};

/** Дефолты Piper (справка; в API сейчас не передаём — использует встроенные). */
export const TTS_DEFAULT_NOISE_SCALE = 0.667;
export const TTS_DEFAULT_NOISE_W_SCALE = 0.8;
export const TTS_DEFAULT_VOLUME = 1.0;

export const TTS_LANG_OPTIONS: { value: TtsLang; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];
