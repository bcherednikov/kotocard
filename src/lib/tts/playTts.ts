'use client';

let currentUtterance: SpeechSynthesisUtterance | null = null;

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

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
  utterance.rate = 0.85; // Немного медленнее для лучшего понимания
  utterance.pitch = 1.0;
  
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
