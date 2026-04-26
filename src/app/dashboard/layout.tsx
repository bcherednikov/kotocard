'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { useEffect, type ReactNode } from 'react';

export default function DashboardV4Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (header) header.style.display = 'none';
    if (main) main.style.background = 'transparent';
    return () => {
      if (header) header.style.display = '';
      if (main) main.style.background = '';
    };
  }, []);
  return <RequireAuth>{children}</RequireAuth>;
}
