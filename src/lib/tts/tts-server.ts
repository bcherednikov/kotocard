import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const TTS_DIR = path.join(PUBLIC_DIR, 'tts');
const PIPER_DIR = path.join(PROJECT_ROOT, 'piper-tts');
const PYTHON_PATH = path.join(PIPER_DIR, 'venv', 'bin', 'python3');

export interface TtsGenerateOptions {
  text: string;
  lang: 'en' | 'ru';
  cardId: string;
  deckId: string;
  speed?: number;
}

/**
 * Генерирует TTS-файл и сохраняет на диск.
 * Возвращает относительный URL для фронтенда: /tts/{deckId}/{cardId}_{lang}.wav
 */
export async function generateAndSaveTts(
  options: TtsGenerateOptions
): Promise<string> {
  const { text, lang, cardId, deckId, speed = 1.2 } = options;

  // Создать структуру папок: /tts/{deckId}/
  const deckDir = path.join(TTS_DIR, deckId);

  if (!fs.existsSync(deckDir)) {
    fs.mkdirSync(deckDir, { recursive: true });
  }

  // Путь к файлу
  const fileName = `${cardId}_${lang}.wav`;
  const filePath = path.join(deckDir, fileName);
  const publicUrl = `/tts/${deckId}/${fileName}`;

  // Если файл уже существует, вернуть URL
  if (fs.existsSync(filePath)) {
    return publicUrl;
  }

  // Определить голос
  const voice = lang === 'ru' ? 'ru_RU-ruslan-medium' : 'en_US-amy-low';

  // Генерировать TTS через Piper
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      PYTHON_PATH,
      [
        '-m',
        'piper',
        '-m',
        voice,
        '-f',
        filePath,
        '--data-dir',
        PIPER_DIR,
        '--length-scale',
        String(speed),
        '--',
        text,
      ],
      { cwd: PIPER_DIR }
    );

    let stderr = '';
    proc.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `piper exit ${code}`));
      }
    });

    proc.on('error', reject);
  });

  return publicUrl;
}

/**
 * Удаляет TTS-файлы для карточки (при удалении карточки или изменении текста)
 */
export function deleteTtsFiles(
  deckId: string,
  cardId: string
): void {
  const deckDir = path.join(TTS_DIR, deckId);

  ['en', 'ru'].forEach((lang) => {
    const filePath = path.join(deckDir, `${cardId}_${lang}.wav`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

/**
 * Проверяет, существует ли TTS-файл
 */
export function ttsFileExists(
  deckId: string,
  cardId: string,
  lang: 'en' | 'ru'
): boolean {
  const filePath = path.join(TTS_DIR, deckId, `${cardId}_${lang}.wav`);
  return fs.existsSync(filePath);
}
