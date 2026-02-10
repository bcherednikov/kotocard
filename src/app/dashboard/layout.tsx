'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
