'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <RequireAuth role="student">{children}</RequireAuth>;
}
