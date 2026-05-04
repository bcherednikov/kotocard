"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedAppShell } from "@/components/layout/ProtectedAppShell";

export default function GrammarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Legacy irregular verbs pages already render the dashboard-style sidebar internally.
  if (pathname.startsWith("/grammar/irregular-verbs")) {
    return <>{children}</>;
  }

  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
