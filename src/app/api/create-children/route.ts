import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Создать Admin client (с service_role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Нужно добавить в .env.local
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { children, familyId, parentToken } = await request.json();

    console.log('🔐 API: Создаём детей для family_id:', familyId);

    // Проверить что родитель авторизован (используя token из клиента)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user: parentUser } } = await supabaseClient.auth.getUser(parentToken);
    if (!parentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    console.log('✅ API: Родитель подтверждён:', parentUser.email);

    // Создать детей через Admin API (БЕЗ автоматического логина!)
    const createdChildren = [];

    for (const child of children) {
      if (!child.name.trim()) continue;

      console.log(`👶 API: Создаём ${child.name}...`);

      // 1. Создать auth user через Admin API
      const { data: childAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: child.email,
        password: child.password,
        email_confirm: true, // Автоматически подтвердить email
        user_metadata: {
          display_name: child.name
        }
      });

      if (authError) {
        console.error(`❌ API: Ошибка создания auth для ${child.name}:`, authError);
        throw authError;
      }

      console.log(`✅ API: Auth создан для ${child.name}, id:`, childAuthData.user.id);

      // 2. Создать профиль студента
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: childAuthData.user.id,
          family_id: familyId,
          display_name: child.name,
          role: 'student'
        });

      if (profileError) {
        console.error(`❌ API: Ошибка создания профиля для ${child.name}:`, profileError);
        throw profileError;
      }

      console.log(`✅ API: Профиль создан для ${child.name}`);

      createdChildren.push({
        name: child.name,
        email: child.email,
        id: childAuthData.user.id
      });
    }

    console.log('🎉 API: Все дети созданы успешно!');

    return NextResponse.json({ 
      success: true, 
      children: createdChildren 
    });

  } catch (error: any) {
    console.error('❌ API: Ошибка:', error);
    return NextResponse.json({ 
      error: error.message || 'Ошибка создания детей' 
    }, { status: 500 });
  }
}
