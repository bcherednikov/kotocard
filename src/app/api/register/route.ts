import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: Request) {
  const supabaseAdmin = getServiceRoleClient();
  try {
    const { email, password, displayName } = await request.json();

    // 1. Создать auth user через Admin API (БЕЗ автологина!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 2. Создать профиль
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        display_name: displayName || email.split('@')[0],
      });

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! Теперь войдите в систему.'
    });

  } catch (error: any) {
    let errorMessage = error.message || 'Ошибка регистрации';
    
    if (errorMessage.includes('duplicate') || errorMessage.includes('already')) {
      errorMessage = 'Этот email уже зарегистрирован';
    }
    
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 400 });
  }
}
