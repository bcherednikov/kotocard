'use client';

import { TTS_DEFAULT_SPEED_BY_LANG, type TtsLang } from './config';

let currentAbortController: AbortController | null = null;
let currentAudio: HTMLAudioElement | null = null;

/**
 * Озвучить карточку через предгенерированное TTS.
 * @param cardId — ID карточки
 * @param lang — язык (en / ru)
 */
export async function playTtsForCard(
  cardId: string,
  lang: TtsLang
): Promise<void> {
  // Остановить предыдущее воспроизведение
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

  // Запросить TTS (предгенерированный или on-the-fly)
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

/**
 * Озвучить текст через Piper TTS API (устаревший метод, для совместимости).
 * @param text — текст для озвучки
 * @param lang — язык (en / ru), определяет голос и скорость по умолчанию
 * @param speed — скорость (length_scale): 1.0 = нормально, >1 = медленнее, <1 = быстрее; если не задано — из конфига по языку
 */
export async function playTts(
  text: string,
  lang: TtsLang,
  speed?: number
): Promise<void> {
  // Остановить предыдущее воспроизведение
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

/**
 * Остановить текущую озвучку.
 */
export function stopTts(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}
