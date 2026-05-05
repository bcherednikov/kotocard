import { NextResponse, type NextRequest } from 'next/server';
import { verifyUser } from '@/lib/supabase/route-handler';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { getPrimaryTestCards, getAllDeckCards } from '@/lib/srs/queries';

export const dynamic = 'force-dynamic';

const MAX_QUESTIONS = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceRoleClient();

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
