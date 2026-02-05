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
    const { familyId, childId, parentToken } = await request.json();

    console.log('🔐 API: Получаем список детей для family_id:', familyId);

    // Проверить что родитель авторизован
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user: parentUser } } = await supabaseClient.auth.getUser(parentToken);
    if (!parentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Загрузить детей из profiles
    let query = supabaseAdmin
      .from('profiles')
      .select('id, display_name, created_at, show_russian_transcription')
      .eq('family_id', familyId)
      .eq('role', 'student');

    // Если передан childId - загрузить только одного ребёнка
    if (childId) {
      query = query.eq('id', childId);
    } else {
      query = query.order('created_at', { ascending: true });
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;

    // Для каждого ребёнка получить email из auth.users
    const childrenWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        
        return {
          id: profile.id,
          display_name: profile.display_name,
          created_at: profile.created_at,
          email: user?.email || '',
          last_sign_in_at: user?.last_sign_in_at || null,
          show_russian_transcription: profile.show_russian_transcription || false
        };
      })
    );

    console.log('✅ API: Загружено детей:', childrenWithEmails.length);

    return NextResponse.json({ 
      children: childrenWithEmails
    });

  } catch (error: any) {
    console.error('❌ API: Ошибка:', error);
    return NextResponse.json({ 
      error: error.message || 'Ошибка загрузки детей'
    }, { status: 500 });
  }
}
