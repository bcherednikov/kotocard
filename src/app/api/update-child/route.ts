import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { childId, name, email, password, showRussianTranscription, parentToken } = await request.json();

    // Проверить что родитель авторизован
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user: parentUser } } = await supabaseClient.auth.getUser(parentToken);
    if (!parentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // 1. Обновить display_name и настройки в profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: name,
        show_russian_transcription: showRussianTranscription,
        updated_at: new Date().toISOString()
      })
      .eq('id', childId);

    if (profileError) throw profileError;

    // 2. Обновить email и/или пароль в auth.users через Admin API
    const updateData: any = { email };
    if (password) {
      updateData.password = password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      childId,
      updateData
    );

    if (authError) throw authError;

    return NextResponse.json({ 
      success: true,
      message: 'Профиль обновлён'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Ошибка обновления'
    }, { status: 500 });
  }
}
