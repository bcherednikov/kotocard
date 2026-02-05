-- Скрипт для диагностики проблем с RLS и профилями

-- 1. Проверить, включён ли RLS на таблице profiles
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. Показать все RLS политики для profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Проверить, существуют ли профили в базе
SELECT 
  id,
  display_name,
  role,
  family_id,
  created_at
FROM profiles
LIMIT 10;

-- 4. Проверить профиль конкретного пользователя (замените USER_ID на нужный)
-- SELECT * FROM profiles WHERE id = 'cac4a501-f086-4b6c-b50b-a189ccd1560b';

-- 5. Проверить связь с auth.users
SELECT 
  p.id,
  p.display_name,
  p.role,
  u.email,
  u.confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
LIMIT 10;

-- 6. Найти пользователей без профилей
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 7. Проверить текущего пользователя (запустите от имени залогиненного пользователя)
-- SELECT auth.uid() as current_user_id;
-- SELECT * FROM profiles WHERE id = auth.uid();
