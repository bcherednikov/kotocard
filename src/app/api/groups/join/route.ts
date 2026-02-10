import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/groups/join — вступить в группу по инвайт-коду
 * Body: { inviteCode, userId }
 */
export async function POST(request: Request) {
  try {
    const { inviteCode, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: 'Код приглашения обязателен' }, { status: 400 });
    }

    // Найти инвайт
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('group_invites')
      .select('*, groups(name)')
      .eq('invite_code', inviteCode.trim())
      .eq('is_active', true)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Приглашение не найдено или неактивно' }, { status: 404 });
    }

    // Проверить срок действия
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Приглашение истекло' }, { status: 400 });
    }

    // Проверить лимит использований
    if (invite.max_uses && invite.use_count >= invite.max_uses) {
      return NextResponse.json({ error: 'Лимит использований исчерпан' }, { status: 400 });
    }

    // Проверить, не состоит ли уже в группе
    const { data: existing } = await supabaseAdmin
      .from('group_members')
      .select('id')
      .eq('group_id', invite.group_id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Вы уже состоите в этой группе', group_id: invite.group_id }, { status: 400 });
    }

    // Добавить в группу
    const { error: joinError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: invite.group_id,
        user_id: userId,
        role: 'member',
      });

    if (joinError) throw joinError;

    // Увеличить счётчик использований
    await supabaseAdmin
      .from('group_invites')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', invite.id);

    return NextResponse.json({
      success: true,
      group_id: invite.group_id,
      group_name: (invite.groups as any)?.name,
    });
  } catch (error: any) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка вступления в группу' },
      { status: 500 }
    );
  }
}
