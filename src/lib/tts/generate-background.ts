import { createClient } from '@/lib/supabase/client';
import { generateAndSaveTts } from './tts-server';

/**
 * Генерирует TTS для массива карточек в фоне (не блокирует ответ API)
 */
export async function generateTtsForCards(
  cardIds: string[],
  options?: { immediate?: boolean }
): Promise<void> {
  const supabase = createClient();

  // Получить данные карточек
  const { data: cards, error } = await supabase
    .from('cards')
    .select('id, deck_id, en_text, ru_text, tts_en_url, tts_ru_url, decks(family_id)')
    .in('id', cardIds);

  if (error || !cards || cards.length === 0) {
    console.error('Failed to fetch cards for TTS generation:', error);
    return;
  }

  // Фильтровать карточки, которым нужна генерация
  const cardsToGenerate = cards.filter(
    (card) => !card.tts_en_url || !card.tts_ru_url
  );

  if (cardsToGenerate.length === 0) {
    return;
  }

  // Генерировать асинхронно (не ждать)
  const generateAsync = async () => {
    for (const card of cardsToGenerate) {
      try {
        const familyId = (card.decks as any)?.family_id;
        if (!familyId) continue;

        const [ttsEnUrl, ttsRuUrl] = await Promise.all([
          card.tts_en_url
            ? Promise.resolve(card.tts_en_url)
            : generateAndSaveTts({
                text: card.en_text,
                lang: 'en',
                cardId: card.id,
                deckId: card.deck_id,
                familyId,
              }),
          card.tts_ru_url
            ? Promise.resolve(card.tts_ru_url)
            : generateAndSaveTts({
                text: card.ru_text,
                lang: 'ru',
                cardId: card.id,
                deckId: card.deck_id,
                familyId,
              }),
        ]);

        // Обновить БД
        await supabase
          .from('cards')
          .update({
            tts_en_url: ttsEnUrl,
            tts_ru_url: ttsRuUrl,
            tts_generated_at: new Date().toISOString(),
          })
          .eq('id', card.id);

        console.log(`✓ TTS generated for card ${card.id}`);
      } catch (error) {
        console.error(`✗ Failed to generate TTS for card ${card.id}:`, error);
      }
    }
  };

  if (options?.immediate) {
    // Ждать завершения (для тестов или bulk-операций)
    await generateAsync();
  } else {
    // Запустить в фоне (не блокировать ответ API)
    generateAsync().catch((err) =>
      console.error('Background TTS generation failed:', err)
    );
  }
}
