import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerSupabase } from '@/lib/supabase/route-handler';
import { getPrimaryTestCards, getAllDeckCards } from '@/lib/srs/queries';

export const dynamic = 'force-dynamic';

const MAX_QUESTIONS = 30;

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

  // Get profile (user_cards use profile.id)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { id: deckId } = await params;
  const profileId = profile.id;

  const [testCards, allDeckCards] = await Promise.all([
    getPrimaryTestCards(supabase, profileId, deckId),
    getAllDeckCards(supabase, deckId),
  ]);

  return NextResponse.json({
    testCards: testCards.slice(0, MAX_QUESTIONS),
    allDeckCards,
  });
}
