import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import translate from 'translate';

// Настройка translate (использовать Google по умолчанию)
translate.engine = 'google';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Определить язык текста
function detectLanguage(text: string): 'ru' | 'en' {
  // Простое определение: если есть кириллица = русский
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
  return hasCyrillic ? 'ru' : 'en';
}

export async function POST(request: Request) {
  try {
    const { deckId, text, parentToken } = await request.json();

    console.log('🔐 API: Массовое создание карточек для deck:', deckId);

    // Проверить авторизацию
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser(parentToken);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Парсинг текста (разделить по строкам, убрать пустые)
    const lines = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Нет слов для перевода' }, { status: 400 });
    }

    console.log('📝 API: Обрабатываем', lines.length, 'слов...');

    // Определить язык первого слова (считаем что все слова на одном языке)
    const sourceLang = detectLanguage(lines[0]);
    const targetLang = sourceLang === 'ru' ? 'en' : 'ru';

    console.log(`🌐 API: Определён язык: ${sourceLang} → ${targetLang}`);

    // Получить текущую максимальную позицию
    const { data: maxCard } = await supabaseAdmin
      .from('cards')
      .select('position')
      .eq('deck_id', deckId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextPosition = maxCard ? maxCard.position + 1 : 0;

    // Перевести каждое слово и создать карточку
    const createdCards = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const sourceText = lines[i];

      try {
        console.log(`  [${i + 1}/${lines.length}] Переводим: ${sourceText}`);

        // Перевести текст
        const translatedText = await translate(sourceText, { 
          from: sourceLang, 
          to: targetLang 
        });

        console.log(`  ✅ Переведено: ${sourceText} → ${translatedText}`);

        // Создать карточку
        const cardData = sourceLang === 'ru' 
          ? { ru_text: sourceText, en_text: translatedText }
          : { ru_text: translatedText, en_text: sourceText };

        const { data: card, error: insertError } = await supabaseAdmin
          .from('cards')
          .insert({
            deck_id: deckId,
            ...cardData,
            position: nextPosition++
          })
          .select()
          .single();

        if (insertError) throw insertError;

        createdCards.push(card);
        console.log(`  ✅ Карточка создана: ${cardData.ru_text} / ${cardData.en_text}`);

      } catch (err: any) {
        console.error(`  ❌ Ошибка для "${sourceText}":`, err.message);
        errors.push({ word: sourceText, error: err.message });
      }
    }

    console.log(`🎉 API: Создано ${createdCards.length} карточек`);

    return NextResponse.json({ 
      success: true,
      created: createdCards.length,
      errors: errors.length > 0 ? errors : undefined,
      cards: createdCards
    });

  } catch (error: any) {
    console.error('❌ API: Ошибка:', error);
    return NextResponse.json({ 
      error: error.message || 'Ошибка создания карточек'
    }, { status: 500 });
  }
}
