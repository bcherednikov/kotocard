import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, parseCookieHeader } from '@supabase/auth-helpers-nextjs';
import { supabaseDirectUrl } from '@/lib/supabase/direct-url';
import { getDeckSrsStats } from '@/lib/srs/queries';

export const dynamic = 'force-dynamic';

function createRouteHandlerSupabase(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookies = parseCookieHeader(cookieHeader);
  return createServerClient(
    supabaseDirectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies.find((c) => c.name === name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createRouteHandlerSupabase(req);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: deckId } = await params;

  const [deckRes, cardsRes, srsStats] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase
      .from('cards')
      .select('id, ru_text, en_text, audio_url, tts_en_url, tts_ru_url, position')
      .eq('deck_id', deckId)
      .order('position', { ascending: true }),
    getDeckSrsStats(supabase, user.id, deckId),
  ]);

  if (deckRes.error || !deckRes.data) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  const cards = cardsRes.data ?? [];
  const cardIds = cards.map((c) => c.id);

  return NextResponse.json(
    { deck: deckRes.data, cards, cardIds, srsStats },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  );
}
