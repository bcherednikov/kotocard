"use client";

import { ProtectedAppShell } from "@/components/layout/ProtectedAppShell";
import { type ReactNode } from "react";

export default function AchievementsLayout({ children }: { children: ReactNode }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
