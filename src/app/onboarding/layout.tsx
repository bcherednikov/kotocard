'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  // Onboarding предназначен только для родителей (admin)
  return <RequireAuth role="admin">{children}</RequireAuth>;
}
