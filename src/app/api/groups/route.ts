import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/groups — создать группу + авто-добавить создателя как admin
 * Body: { name, description?, deck_add_permission?, userId }
 */
export async function POST(request: Request) {
  try {
    const { name, description, deck_add_permission, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    // Создать группу
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        deck_add_permission: deck_add_permission || 'admin_only',
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Добавить создателя как admin
    const { error: memberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) throw memberError;

    return NextResponse.json({ success: true, group });
  } catch (error: any) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка создания группы' },
      { status: 500 }
    );
  }
}
