'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function DecksLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
