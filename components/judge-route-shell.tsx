"use client";

import { usePathname } from "next/navigation";

import { JudgeHeader } from "@/components/judge-header";

export function JudgeRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isScoringRoute = pathname.endsWith("/score");

  if (isScoringRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <JudgeHeader />
      {children}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Judging Session: Winter Hack 2026 · Track Engineering Excellence
      </footer>
    </>
  );
}
