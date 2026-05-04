"use client";

import { ProtectedAppShell } from "@/components/layout/ProtectedAppShell";
import { type ReactNode } from "react";

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
