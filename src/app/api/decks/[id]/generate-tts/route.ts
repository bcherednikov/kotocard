import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { generateAndSaveTts } from '@/lib/tts/tts-server';

/**
 * POST /api/decks/[id]/generate-tts
 * Генерирует TTS для всех карточек в наборе
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    // Получить все карточки набора
    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, en_text, ru_text, tts_en_url, tts_ru_url, decks(family_id)')
      .eq('deck_id', deckId)
      .order('position');

    if (error || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: 'Cards not found' },
        { status: 404 }
      );
    }

    const familyId = (cards[0].decks as any)?.family_id;
    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID not found' },
        { status: 400 }
      );
    }

    // Фильтруем карточки, которым нужна генерация (или проверяем физическое наличие файлов)
    const cardsToGenerate = cards;

    // Запускаем генерацию в фоне
    const generateAsync = async () => {
      let processed = 0;
      for (const card of cardsToGenerate) {
        try {
          // Всегда генерируем (перезаписываем существующие)
          const [ttsEnUrl, ttsRuUrl] = await Promise.all([
            generateAndSaveTts({
              text: card.en_text,
              lang: 'en',
              cardId: card.id,
              deckId,
              familyId,
            }),
            generateAndSaveTts({
              text: card.ru_text,
              lang: 'ru',
              cardId: card.id,
              deckId,
              familyId,
            }),
          ]);

          await supabase
            .from('cards')
            .update({
              tts_en_url: ttsEnUrl,
              tts_ru_url: ttsRuUrl,
              tts_generated_at: new Date().toISOString(),
            })
            .eq('id', card.id);

          processed++;
          console.log(`✓ TTS generated for card ${card.id} (${processed}/${cardsToGenerate.length})`);
        } catch (error) {
          console.error(`✗ Failed to generate TTS for card ${card.id}:`, error);
        }
      }
      console.log(`✓ TTS generation complete: ${processed}/${cardsToGenerate.length} cards`);
    };

    // Запустить в фоне
    generateAsync().catch((err) =>
      console.error('Background TTS generation failed:', err)
    );

    return NextResponse.json({
      success: true,
      total_cards: cards.length,
      to_generate: cardsToGenerate.length,
      message: `Генерация запущена для ${cardsToGenerate.length} карточек`,
    });
  } catch (error) {
    console.error('Deck TTS generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start generation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/decks/[id]/generate-tts
 * Получить статистику TTS для набора
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, tts_en_url, tts_ru_url, tts_generated_at')
      .eq('deck_id', deckId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = cards?.length || 0;
    const withTts = cards?.filter((c) => c.tts_en_url && c.tts_ru_url).length || 0;
    const pending = total - withTts;

    return NextResponse.json({
      total,
      with_tts: withTts,
      pending,
      percentage: total > 0 ? Math.round((withTts / total) * 100) : 0,
    });
  } catch (error) {
    console.error('TTS stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 }
    );
  }
}
