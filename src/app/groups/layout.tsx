'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
