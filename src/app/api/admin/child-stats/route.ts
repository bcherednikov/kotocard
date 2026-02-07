import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { childId, period = 'all', parentToken } = await request.json();

    if (!childId || !parentToken) {
      return NextResponse.json(
        { error: 'Нужны childId и parentToken' },
        { status: 400 }
      );
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user: parentUser },
    } = await supabaseClient.auth.getUser(parentToken);
    if (!parentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { data: parentProfile } = await supabaseAdmin
      .from('profiles')
      .select('family_id, role')
      .eq('id', parentUser.id)
      .single();

    if (!parentProfile || parentProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Доступ только для родителя' },
        { status: 403 }
      );
    }

    const { data: childProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, family_id, display_name')
      .eq('id', childId)
      .single();

    if (
      !childProfile ||
      childProfile.family_id !== parentProfile.family_id
    ) {
      return NextResponse.json(
        { error: 'Ребёнок не найден или не из вашей семьи' },
        { status: 404 }
      );
    }

    const now = new Date();
    let dateFilter: string | null = null;
    if (period === 'day') {
      dateFilter = new Date(
        now.getTime() - 24 * 60 * 60 * 1000
      ).toISOString();
    } else if (period === 'week') {
      dateFilter = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    // Test sessions (kept for historical data)
    let sessionsQuery = supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', childId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (dateFilter) {
      sessionsQuery = sessionsQuery.gte('completed_at', dateFilter);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) throw sessionsError;

    // SRS stats from user_cards
    const { data: userCards, error: ucError } = await supabaseAdmin
      .from('user_cards')
      .select('status')
      .eq('user_id', childId);

    if (ucError) throw ucError;

    const statusCounts: Record<string, number> = {
      new: 0, learning: 0, testing: 0, young: 0, mature: 0, relearning: 0,
    };
    for (const uc of userCards ?? []) {
      if (statusCounts[uc.status] !== undefined) {
        statusCounts[uc.status]++;
      }
    }

    const totalCards = (userCards ?? []).length;
    const masteredCount = statusCounts.young + statusCounts.mature;
    const masteryPercent = totalCards === 0 ? 0 : Math.round((masteredCount / totalCards) * 100);

    const totalTests = (sessions || []).length;
    const totalCorrect = (sessions || []).reduce(
      (sum, s) => sum + (s.correct_count ?? 0),
      0
    );
    const totalQuestions = (sessions || []).reduce(
      (sum, s) => sum + (s.total_questions ?? 0),
      0
    );
    const averageScore =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    return NextResponse.json({
      childName: childProfile.display_name,
      studiedCardsCount: masteredCount,
      totalCardsCount: totalCards,
      masteryPercent,
      statusCounts,
      sessions: sessions || [],
      totalTests,
      totalCorrect,
      totalQuestions,
      averageScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка загрузки статистики' },
      { status: 500 }
    );
  }
}
