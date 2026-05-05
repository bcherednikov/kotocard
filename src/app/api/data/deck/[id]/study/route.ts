import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, parseCookieHeader } from '@supabase/auth-helpers-nextjs';
import { supabaseDirectUrl } from '@/lib/supabase/direct-url';
import type { UserCardWithCard } from '@/lib/srs/types';

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

  // Get profile (user_cards use profile.id not user.id)
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

  // Parallel: card ids + existing user_cards
  const [cardIdsRes, userCardsRes] = await Promise.all([
    supabase.from('cards').select('id').eq('deck_id', deckId),
    supabase
      .from('user_cards')
      .select('*, cards(*)')
      .eq('user_id', profileId)
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true }),
  ]);

  const allCardIds = (cardIdsRes.data ?? []).map((c) => c.id);
  let userCards = (userCardsRes.data ?? []) as UserCardWithCard[];

  // Insert missing user_cards
  const existingIds = new Set(userCards.map((uc) => uc.card_id));
  const missingIds = allCardIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    await supabase.from('user_cards').insert(
      missingIds.map((id) => ({
        card_id: id,
        user_id: profileId,
        deck_id: deckId,
        status: 'new' as const,
      }))
    );
    const { data: refreshed } = await supabase
      .from('user_cards')
      .select('*, cards(*)')
      .eq('user_id', profileId)
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    userCards = (refreshed ?? []) as UserCardWithCard[];
  }

  // Shuffle on server
  const shuffled = [...userCards].sort(() => Math.random() - 0.5);

  return NextResponse.json({ userCards: shuffled });
}
