'use client';

import { useAuth, Profile } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

type Props = {
  children: ReactNode;
  role?: 'admin' | 'student';  // undefined = любая роль
  fallback?: ReactNode;        // что показывать во время загрузки
};

// Дефолтный fallback - спиннер загрузки
function DefaultFallback() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-xl text-gray-800">Загрузка...</p>
    </div>
  );
}

// Редирект в зависимости от роли
function getRedirectPath(profile: Profile | null, requiredRole?: 'admin' | 'student'): string | null {
  // Если нет профиля - на логин
  if (!profile) return '/login';

  // Если роль не указана - доступ разрешён
  if (!requiredRole) return null;

  // Если роль совпадает - доступ разрешён
  if (profile.role === requiredRole) return null;

  // Редирект на правильную страницу в зависимости от роли пользователя
  return profile.role === 'admin' ? '/admin/decks' : '/student';
}

export function RequireAuth({ children, role, fallback }: Props) {
  const router = useRouter();
  const { user, profile, isInitialized, isLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Ждём пока AuthContext инициализируется
    if (!isInitialized) return;

    // Если нет пользователя - редирект на логин
    if (!user) {
      router.replace('/login');
      return;
    }

    // Если грузится профиль - ждём
    if (isLoading) return;

    // Проверяем права доступа
    const redirectPath = getRedirectPath(profile, role);

    if (redirectPath) {
      router.replace(redirectPath);
      return;
    }

    // Всё ок - разрешаем рендер
    setShouldRender(true);
  }, [isInitialized, isLoading, user, profile, role, router]);

  // Пока не инициализировано или грузится - показываем fallback
  if (!isInitialized || isLoading || !shouldRender) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  // Рендерим детей
  return <>{children}</>;
}
