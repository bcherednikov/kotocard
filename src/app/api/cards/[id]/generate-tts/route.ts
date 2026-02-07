import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { generateAndSaveTts } from '@/lib/tts/tts-server';

/**
 * POST /api/cards/[id]/generate-tts
 * Генерирует TTS для карточки (en + ru) и сохраняет URL в БД
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id;

    // Получить данные карточки
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, deck_id, en_text, ru_text, decks(family_id)')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    const familyId = (card.decks as any)?.family_id;
    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID not found' },
        { status: 400 }
      );
    }

    // Генерировать TTS для обоих языков
    const [ttsEnUrl, ttsRuUrl] = await Promise.all([
      generateAndSaveTts({
        text: card.en_text,
        lang: 'en',
        cardId: card.id,
        deckId: card.deck_id,
        familyId,
      }),
      generateAndSaveTts({
        text: card.ru_text,
        lang: 'ru',
        cardId: card.id,
        deckId: card.deck_id,
        familyId,
      }),
    ]);

    // Обновить БД
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        tts_en_url: ttsEnUrl,
        tts_ru_url: ttsRuUrl,
        tts_generated_at: new Date().toISOString(),
      })
      .eq('id', cardId);

    if (updateError) {
      console.error('Failed to update card TTS URLs:', updateError);
      return NextResponse.json(
        { error: 'Failed to update database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tts_en_url: ttsEnUrl,
      tts_ru_url: ttsRuUrl,
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS generation failed' },
      { status: 500 }
    );
  }
}
