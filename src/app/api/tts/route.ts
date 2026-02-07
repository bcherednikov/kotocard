import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { NextResponse } from 'next/server';
import { TTS_VOICE_BY_LANG, TTS_DEFAULT_SPEED_BY_LANG } from '@/lib/tts/config';

const PROJECT_ROOT = process.cwd();
const PIPER_DIR = path.join(PROJECT_ROOT, 'piper-tts');
const PYTHON_PATH = path.join(PIPER_DIR, 'venv', 'bin', 'python3');
const MAX_TEXT_LENGTH = 2000;

type TtsLang = 'en' | 'ru';

function getVoice(lang: string): string {
  const key = lang === 'ru' ? 'ru' : 'en';
  return TTS_VOICE_BY_LANG[key as TtsLang];
}

function getDefaultSpeed(lang: string): number {
  const key = lang === 'ru' ? 'ru' : 'en';
  return TTS_DEFAULT_SPEED_BY_LANG[key as TtsLang];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const lang = body?.lang === 'ru' ? 'ru' : 'en';
    const speed = body?.speed != null ? Number(body.speed) : getDefaultSpeed(lang);

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `text too long (max ${MAX_TEXT_LENGTH})` },
        { status: 400 }
      );
    }

    const voice = getVoice(lang);
    const lengthScale = Number.isFinite(speed) && speed > 0 ? speed : getDefaultSpeed(lang);
    const wavPath = path.join(os.tmpdir(), `piper-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);

    const modelPath = path.join(PIPER_DIR, `${voice}.onnx`);
    if (!fs.existsSync(modelPath)) {
      return NextResponse.json(
        { error: `Voice model not found: ${voice}. Run: python -m piper.download_voices ${voice}` },
        { status: 503 }
      );
    }

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        PYTHON_PATH,
        [
          '-m',
          'piper',
          '-m',
          voice,
          '-f',
          wavPath,
          '--data-dir',
          PIPER_DIR,
          '--length-scale',
          String(lengthScale),
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
        if (code === 0) resolve();
        else reject(new Error(stderr || `piper exit ${code}`));
      });
      proc.on('error', reject);
    });

    const wavBuffer = fs.readFileSync(wavPath);
    try {
      fs.unlinkSync(wavPath);
    } catch {
      // ignore cleanup errors
    }

    return new NextResponse(wavBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (e) {
    console.error('TTS error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
