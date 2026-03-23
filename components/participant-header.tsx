"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, UserRound } from "lucide-react";

import { participantNavItems } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function ParticipantHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-radix-gray-a-2 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/submission/assets" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-radix-teal-a-4 text-primary">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold tracking-tight">Project Assets</div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Submission Studio
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {participantNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button onClick={() => console.log("Saving progress from header")}>Save Progress</Button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-radix-teal-a-5 bg-radix-teal-a-3 text-primary">
            <UserRound className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
