'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireAuth role="admin">{children}</RequireAuth>;
}
