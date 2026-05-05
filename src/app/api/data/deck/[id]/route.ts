import { NextResponse, type NextRequest } from 'next/server';
import { verifyUser } from '@/lib/supabase/route-handler';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getDeckSrsStats } from '@/lib/srs/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();
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
