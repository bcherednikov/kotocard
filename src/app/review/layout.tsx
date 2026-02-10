'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
