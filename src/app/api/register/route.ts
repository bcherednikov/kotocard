import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin client для создания пользователей БЕЗ автологина
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
    const { email, password, familyName } = await request.json();

    console.log('🔐 API: Регистрация родителя:', email);

    // 1. Создать auth user через Admin API (БЕЗ автологина!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Автоматически подтвердить
      user_metadata: {
        family_name: familyName
      }
    });

    if (authError) {
      console.error('❌ API: Ошибка создания auth user:', authError);
      throw authError;
    }

    console.log('✅ API: Auth user создан:', authData.user.id);

    // 2. Создать семью
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({ name: familyName })
      .select()
      .single();

    if (familyError) {
      console.error('❌ API: Ошибка создания семьи:', familyError);
      throw familyError;
    }

    console.log('✅ API: Семья создана:', family.id);

    // 3. Создать профиль админа
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        family_id: family.id,
        display_name: email.split('@')[0],
        role: 'admin'
      });

    if (profileError) {
      console.error('❌ API: Ошибка создания профиля:', profileError);
      throw profileError;
    }

    console.log('✅ API: Профиль админа создан!');

    return NextResponse.json({ 
      success: true,
      message: 'Регистрация успешна! Теперь войдите в систему.'
    });

  } catch (error: any) {
    console.error('❌ API: Ошибка регистрации:', error);
    
    let errorMessage = error.message || 'Ошибка регистрации';
    
    if (errorMessage.includes('duplicate') || errorMessage.includes('already')) {
      errorMessage = 'Этот email уже зарегистрирован';
    }
    
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 400 });
  }
}
