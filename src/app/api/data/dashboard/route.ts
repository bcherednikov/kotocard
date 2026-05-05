import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, parseCookieHeader } from '@supabase/auth-helpers-nextjs';
import { supabaseDirectUrl } from '@/lib/supabase/direct-url';
import { getDecksSrsStats, getReviewCount } from '@/lib/srs/queries';
import { getStreakData, getTodayActivity, getLast7Days } from '@/lib/analytics/queries';

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

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerSupabase(req);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Parallel: own decks + group memberships
  const [ownDecksRes, myGroupsRes] = await Promise.all([
    supabase
      .from('decks')
      .select('id, name, description, tags, owner_id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', userId),
  ]);

  const ownDecks = ownDecksRes.data ?? [];
  const myGroups = myGroupsRes.data ?? [];

  // Fetch group decks
  type DeckRow = { id: string; name: string; description: string | null; tags: string[]; owner_id: string };
  const groupMap = new Map<string, { id: string; name: string; decks: DeckRow[] }>();
  const allGroupDecks: DeckRow[] = [];

  if (myGroups.length > 0) {
    for (const mg of myGroups) {
      const g = mg.groups as unknown as { id: string; name: string } | null;
      if (g) groupMap.set(g.id, { id: g.id, name: g.name, decks: [] });
    }

    const { data: gDecks } = await supabase
      .from('group_decks')
      .select('group_id, deck:decks(id, name, description, tags, owner_id)')
      .in('group_id', myGroups.map((g) => g.group_id));

    if (gDecks) {
      const seen = new Set<string>();
      for (const gd of gDecks) {
        const d = gd.deck as unknown as DeckRow;
        if (!d) continue;
        groupMap.get(gd.group_id)?.decks.push(d);
        if (!seen.has(d.id)) {
          seen.add(d.id);
          allGroupDecks.push(d);
        }
      }
    }
  }

  const allDecks = [...ownDecks, ...allGroupDecks];
  const ids = allDecks.map((d) => d.id);

  // Parallel: SRS stats + review count + streak + today activity + last 7 days
  const [statsMap, reviewCount, streak, todayActivity, last7days] = await Promise.all([
    ids.length
      ? getDecksSrsStats(supabase, userId, ids)
      : Promise.resolve(new Map()),
    getReviewCount(supabase, userId),
    getStreakData(supabase, userId).catch(() => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    })),
    getTodayActivity(supabase, userId).catch(() => ({
      wordsStudied: 0,
      reviewsCompleted: 0,
      total: 0,
      goal: 10,
      completed: false,
    })),
    getLast7Days(supabase, userId).catch(() => []),
  ]);

  const withStats = (decks: DeckRow[]) =>
    decks.map((d) => ({ ...d, stats: statsMap.get(d.id) ?? null }));

  const groupSections: { id: string; name: string; decks: (DeckRow & { stats: unknown })[] }[] = [];
  for (const [, entry] of groupMap) {
    if (entry.decks.length > 0) {
      groupSections.push({ id: entry.id, name: entry.name, decks: withStats(entry.decks) });
    }
  }

  return NextResponse.json({
    ownDecks: withStats(ownDecks),
    groupSections,
    reviewCount,
    streak,
    todayActivity,
    last7days,
  });
}
