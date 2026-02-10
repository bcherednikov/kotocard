import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/groups/[id]/leave — выйти из группы
 * Body: { userId }
 * Если уходит последний админ — все оставшиеся становятся админами
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Найти запись участника
    const { data: membership, error: memError } = await supabaseAdmin
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memError || !membership) {
      return NextResponse.json({ error: 'Вы не состоите в этой группе' }, { status: 400 });
    }

    // Если уходящий — админ, проверить остальных
    if (membership.role === 'admin') {
      const { data: admins } = await supabaseAdmin
        .from('group_members')
        .select('id, user_id')
        .eq('group_id', groupId)
        .eq('role', 'admin');

      if (admins && admins.length === 1) {
        // Последний админ — назначить всех оставшихся админами
        const { data: otherMembers } = await supabaseAdmin
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .neq('user_id', userId);

        if (otherMembers && otherMembers.length > 0) {
          await supabaseAdmin
            .from('group_members')
            .update({ role: 'admin' })
            .eq('group_id', groupId)
            .neq('user_id', userId);
        }
      }
    }

    // Удалить участника
    const { error: deleteError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('id', membership.id);

    if (deleteError) throw deleteError;

    // Если не осталось участников — удалить группу
    const { count } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (count === 0) {
      await supabaseAdmin.from('groups').delete().eq('id', groupId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка выхода из группы' },
      { status: 500 }
    );
  }
}
