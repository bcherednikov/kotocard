'use client';

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Получить голоса (iOS грузит их асинхронно через voiceschanged).
 */
async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  let voices = speechSynthesis.getVoices();
  if (voices.length > 0) return voices;
  return new Promise(resolve => {
    const handler = () => {
      speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback если событие уже не придёт
    setTimeout(() => { speechSynthesis.removeEventListener('voiceschanged', handler); resolve(speechSynthesis.getVoices()); }, 500);
  });
}

/**
 * Найти наиболее подходящий голос для языка.
 * На старых iOS без явного voice браузер может использовать голос по умолчанию (русский).
 */
async function findVoice(bcp47: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await getVoices();
  const prefix = bcp47.split('-')[0]; // 'en' или 'ru'
  return (
    voices.find(v => v.lang === bcp47) ||           // точное совпадение: en-US
    voices.find(v => v.lang.startsWith(prefix + '-')) || // en-GB, en-AU...
    voices.find(v => v.lang.startsWith(prefix)) ||  // en
    null
  );
}

/**
 * Озвучить текст через браузерный TTS (Web Speech API).
 * @param text — текст для озвучки
 * @param lang — язык (en / ru)
 */
export async function playTts(
  text: string,
  lang: 'en' | 'ru'
): Promise<void> {
  // Остановить предыдущее воспроизведение
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }

  const bcp47 = lang === 'ru' ? 'ru-RU' : 'en-US';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  utterance.rate = 0.85; // Немного медленнее для лучшего понимания
  utterance.pitch = 1.0;

  const voice = await findVoice(bcp47);
  if (voice) utterance.voice = voice;

  currentUtterance = utterance;

  utterance.onend = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };
  
  utterance.onerror = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };

  speechSynthesis.speak(utterance);
}

/**
 * Остановить текущую озвучку.
 */
export function stopTts(): void {
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// ===== ЗАКОММЕНТИРОВАННЫЙ КОД PIPER TTS (для будущего возврата) =====
/*
import { TTS_DEFAULT_SPEED_BY_LANG, type TtsLang } from './config';

let currentAbortController: AbortController | null = null;
let currentAudio: HTMLAudioElement | null = null;

export async function playTtsForCard(
  cardId: string,
  lang: TtsLang
): Promise<void> {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }

  const controller = new AbortController();
  currentAbortController = controller;

  const res = await fetch(`/api/tts/card/${cardId}?lang=${lang}`, {
    signal: controller.signal,
  });

  currentAbortController = null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || 'TTS failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };

  await audio.play();
}

export async function playTts(
  text: string,
  lang: TtsLang,
  speed?: number
): Promise<void> {
  if (currentAbortController) {
    currentAbortController.abort();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }

  const lengthScale = speed ?? TTS_DEFAULT_SPEED_BY_LANG[lang];

  const controller = new AbortController();
  currentAbortController = controller;

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang, speed: lengthScale }),
    signal: controller.signal,
  });

  currentAbortController = null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || 'TTS failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };
  audio.onerror = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };

  await audio.play();
}
*/
