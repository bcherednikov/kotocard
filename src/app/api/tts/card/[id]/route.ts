import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { generateAndSaveTts, ttsFileExists } from '@/lib/tts/tts-server';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * GET /api/tts/card/[id]?lang=en
 * Возвращает предгенерированное TTS или генерирует на лету
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') === 'ru' ? 'ru' : 'en';

    const supabase = createClient();

    // Получить карточку с URL TTS
    const { data: card, error } = await supabase
      .from('cards')
      .select('id, deck_id, en_text, ru_text, tts_en_url, tts_ru_url, decks(family_id)')
      .eq('id', cardId)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const ttsUrl = lang === 'en' ? card.tts_en_url : card.tts_ru_url;
    const familyId = (card.decks as any)?.family_id;

    // Если URL есть в БД и файл существует — вернуть его
    if (ttsUrl && familyId) {
      const filePath = path.join(PUBLIC_DIR, ttsUrl);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=31536000', // 1 год (файл не меняется)
          },
        });
      }
    }

    // Если нет — генерировать на лету и сохранить
    if (!familyId) {
      return NextResponse.json({ error: 'Family ID not found' }, { status: 400 });
    }

    const text = lang === 'en' ? card.en_text : card.ru_text;
    
    const generatedUrl = await generateAndSaveTts({
      text,
      lang,
      cardId: card.id,
      deckId: card.deck_id,
      familyId,
    });

    // Обновить БД
    const updateField = lang === 'en' ? 'tts_en_url' : 'tts_ru_url';
    await supabase
      .from('cards')
      .update({
        [updateField]: generatedUrl,
        tts_generated_at: new Date().toISOString(),
      })
      .eq('id', cardId);

    // Вернуть файл
    const filePath = path.join(PUBLIC_DIR, generatedUrl);
    const buffer = fs.readFileSync(filePath);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
