'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

function DefaultFallback() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-xl text-gray-800">Загрузка...</p>
    </div>
  );
}

export function RequireAuth({ children, fallback }: Props) {
  const router = useRouter();
  const { user, profile, isInitialized, isLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (isLoading) return;

    if (!profile) {
      router.replace('/login');
      return;
    }

    setShouldRender(true);
  }, [isInitialized, isLoading, user, profile, router]);

  if (!isInitialized || isLoading || !shouldRender) {
    return <>{fallback || <DefaultFallback />}</>;
  }

  return <>{children}</>;
}
